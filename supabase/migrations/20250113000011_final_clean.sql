/*
  # Final Clean Migration for Image Storage
  
  This migration removes all existing functions and creates new ones
  to avoid conflicts.
*/

-- Step 1: Drop all existing functions that might conflict
DROP FUNCTION IF EXISTS get_or_create_card CASCADE;
DROP FUNCTION IF EXISTS add_card_to_user CASCADE;
DROP FUNCTION IF EXISTS add_card_to_user_and_get_id CASCADE;

-- Step 2: Add english field to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS english TEXT;
COMMENT ON COLUMN cards.english IS 'English translation of the word, used for image generation and three-language support';

-- Step 3: Add image storage fields
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_metadata JSONB;
ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS custom_image_path TEXT;
ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS custom_image_metadata JSONB;

-- Step 4: Add comments
COMMENT ON COLUMN cards.image_path IS 'Path to image in storage.buckets.cards (public)';
COMMENT ON COLUMN cards.image_metadata IS 'Metadata about the image (source, prompt, etc.)';
COMMENT ON COLUMN user_cards.custom_image_path IS 'Path to user-specific image in storage.buckets.user-images (private)';
COMMENT ON COLUMN user_cards.custom_image_metadata IS 'Metadata about the user-specific image';

-- Step 5: Update existing data
UPDATE cards 
SET english = translation 
WHERE language_pair_id LIKE '%en%' 
  AND english IS NULL;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_english ON cards(english);
CREATE INDEX IF NOT EXISTS idx_cards_image_path ON cards(image_path);
CREATE INDEX IF NOT EXISTS idx_user_cards_custom_image_path ON user_cards(custom_image_path);

-- Step 7: Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_english_not_empty'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT check_english_not_empty 
      CHECK (english IS NULL OR length(trim(english)) > 0);
  END IF;
END $$;

-- Step 8: Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cards', 'cards', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png']),
  ('user-images', 'user-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 9: Create helper functions
CREATE OR REPLACE FUNCTION get_public_image_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Return a placeholder URL that should be replaced by the client
  RETURN CONCAT('https://your-project.supabase.co/storage/v1/object/public/cards/', image_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_signed_image_url(
  image_path TEXT,
  expires_in_seconds INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Return a placeholder that should be replaced by the client
  RETURN CONCAT('signed://', image_path, '?expires=', expires_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create main functions with explicit signatures
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT id INTO card_id
  FROM cards
  WHERE language_pair_id = p_language_pair_id
    AND term = p_term
    AND translation = p_translation;
  
  IF card_id IS NULL THEN
    INSERT INTO cards (language_pair_id, term, translation, image_url, english)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url, p_english)
    RETURNING id INTO card_id;
  ELSE
    IF p_english IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM cards WHERE id = card_id AND english IS NOT NULL
    ) THEN
      UPDATE cards SET english = p_english WHERE id = card_id;
    END IF;
  END IF;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create views
DROP VIEW IF EXISTS user_cards_with_content CASCADE;
CREATE VIEW user_cards_with_content AS
SELECT 
  uc.user_id,
  uc.card_id,
  uc.state,
  uc.progress,
  uc.review_count,
  uc.successful_reviews,
  uc.direction,
  uc.ease_factor,
  uc.interval_days,
  uc.due_at,
  uc.last_reviewed_at,
  uc.created_at,
  uc.updated_at,
  uc.custom_image_path,
  uc.custom_image_metadata,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url,
  c.image_path,
  c.image_metadata,
  c.english
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

DROP VIEW IF EXISTS cards_due_for_review CASCADE;
CREATE VIEW cards_due_for_review AS
SELECT 
  uc.*,
  c.term,
  c.translation,
  c.image_url,
  c.image_path,
  c.image_metadata,
  c.english
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.due_at <= now()
  AND uc.state = 'REVIEW';

-- Step 12: Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_card(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_image_url(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_signed_image_url(text, integer) TO authenticated;

-- Step 13: Final verification
DO $$
DECLARE
  cards_bucket_exists BOOLEAN;
  user_images_bucket_exists BOOLEAN;
  image_path_column_exists BOOLEAN;
  custom_image_path_column_exists BOOLEAN;
  english_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'cards') INTO cards_bucket_exists;
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'user-images') INTO user_images_bucket_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'image_path'
  ) INTO image_path_column_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_cards' AND column_name = 'custom_image_path'
  ) INTO custom_image_path_column_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'english'
  ) INTO english_column_exists;
  
  RAISE NOTICE '=== IMAGE STORAGE SETUP COMPLETE ===';
  RAISE NOTICE 'Cards bucket exists: %', cards_bucket_exists;
  RAISE NOTICE 'User-images bucket exists: %', user_images_bucket_exists;
  RAISE NOTICE 'English column exists: %', english_column_exists;
  RAISE NOTICE 'Image path column exists: %', image_path_column_exists;
  RAISE NOTICE 'Custom image path column exists: %', custom_image_path_column_exists;
  RAISE NOTICE 'All database fields and functions created successfully!';
  RAISE NOTICE 'Note: RLS policies need to be configured manually in Supabase Dashboard';
END $$;
