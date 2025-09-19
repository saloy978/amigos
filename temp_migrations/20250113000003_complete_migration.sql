/*
  # Complete Migration - Handle All Cases
  
  This migration handles all possible states:
  1. No migration applied yet (cards table with user_id)
  2. Partial migration (cards_old exists)
  3. Complete migration (new schema already exists)
*/

-- Step 1: Check current state and determine what to do
DO $$
DECLARE
  has_cards_old BOOLEAN;
  has_cards_with_user_id BOOLEAN;
  has_new_cards BOOLEAN;
  has_user_cards BOOLEAN;
  cards_count INTEGER;
BEGIN
  -- Check if cards_old exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cards_old' AND table_schema = 'public'
  ) INTO has_cards_old;
  
  -- Check if cards table has user_id (old schema)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' 
      AND column_name = 'user_id'
      AND table_schema = 'public'
  ) INTO has_cards_with_user_id;
  
  -- Check if new cards table exists (without user_id)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cards' 
      AND table_schema = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cards' 
          AND column_name = 'user_id'
          AND table_schema = 'public'
      )
  ) INTO has_new_cards;
  
  -- Check if user_cards exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_cards' AND table_schema = 'public'
  ) INTO has_user_cards;
  
  -- Get cards count
  IF has_cards_with_user_id OR has_new_cards THEN
    SELECT COUNT(*) INTO cards_count FROM cards;
  ELSE
    cards_count := 0;
  END IF;
  
  RAISE NOTICE '=== DATABASE STATE ANALYSIS ===';
  RAISE NOTICE 'cards_old exists: %', has_cards_old;
  RAISE NOTICE 'cards with user_id (old schema): %', has_cards_with_user_id;
  RAISE NOTICE 'new cards table (without user_id): %', has_new_cards;
  RAISE NOTICE 'user_cards exists: %', has_user_cards;
  RAISE NOTICE 'cards count: %', cards_count;
  
  -- Determine migration strategy
  IF has_cards_old THEN
    RAISE NOTICE 'STRATEGY: Continue from cards_old (partial migration detected)';
  ELSIF has_cards_with_user_id THEN
    RAISE NOTICE 'STRATEGY: Start fresh migration from cards table';
  ELSIF has_new_cards AND has_user_cards THEN
    RAISE NOTICE 'STRATEGY: Migration already complete - nothing to do';
  ELSE
    RAISE NOTICE 'STRATEGY: No cards data found - create empty schema';
  END IF;
END $$;

-- Step 2: Create backup and rename if needed
DO $$
DECLARE
  has_cards_with_user_id BOOLEAN;
BEGIN
  -- Check if we need to rename cards to cards_old
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' 
      AND column_name = 'user_id'
      AND table_schema = 'public'
  ) INTO has_cards_with_user_id;
  
  IF has_cards_with_user_id THEN
    RAISE NOTICE 'Renaming cards table to cards_old...';
    ALTER TABLE cards RENAME TO cards_old;
  END IF;
END $$;

-- Step 3: Create new schema if it doesn't exist
CREATE TABLE IF NOT EXISTS cards (
  id BIGSERIAL PRIMARY KEY,
  language_pair_id TEXT NOT NULL,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS cards_uniq ON cards(language_pair_id, term, translation);

-- Create user_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_cards (
  user_id UUID NOT NULL,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'LEARN',
  progress INT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  successful_reviews INT NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'K_TO_L',
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  prev_interval INT,
  next_interval INT,
  prev_ef NUMERIC,
  next_ef NUMERIC
);

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add state constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_cards_state_check'
  ) THEN
    ALTER TABLE user_cards ADD CONSTRAINT user_cards_state_check 
    CHECK (state IN ('LEARN', 'REVIEW', 'SUSPENDED'));
  END IF;
  
  -- Add direction constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_cards_direction_check'
  ) THEN
    ALTER TABLE user_cards ADD CONSTRAINT user_cards_direction_check 
    CHECK (direction IN ('K_TO_L', 'L_TO_K'));
  END IF;
  
  -- Add progress constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_cards_progress_check'
  ) THEN
    ALTER TABLE user_cards ADD CONSTRAINT user_cards_progress_check 
    CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS user_cards_due_idx ON user_cards(user_id, due_at) WHERE state <> 'SUSPENDED';
CREATE INDEX IF NOT EXISTS user_cards_user_state_idx ON user_cards(user_id, state);
CREATE INDEX IF NOT EXISTS reviews_user_card_idx ON reviews(user_id, card_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_reviewed_at_idx ON reviews(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_language_pair ON cards(language_pair_id);
CREATE INDEX IF NOT EXISTS idx_cards_term ON cards(term);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Step 4: Migrate data if cards_old exists
DO $$
DECLARE
  cards_old_count INTEGER;
  cards_count_before INTEGER;
  cards_count_after INTEGER;
  user_cards_count INTEGER;
BEGIN
  -- Check if cards_old exists and get count
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cards_old' AND table_schema = 'public'
  ) THEN
    SELECT COUNT(*) INTO cards_old_count FROM cards_old;
  ELSE
    cards_old_count := 0;
  END IF;
  
  IF cards_old_count > 0 THEN
    RAISE NOTICE 'Found % records in cards_old, starting migration...', cards_old_count;
    
    -- Get count before migration
    SELECT COUNT(*) INTO cards_count_before FROM cards;
    
    -- Migrate unique cards to global cards table
    INSERT INTO cards (language_pair_id, term, translation, image_url)
    SELECT DISTINCT
      language_pair_id,
      trim(term) AS term,
      trim(translation) AS translation,
      image_url
    FROM cards_old
    ON CONFLICT (language_pair_id, term, translation) DO NOTHING;
    
    -- Get count after migration
    SELECT COUNT(*) INTO cards_count_after FROM cards;
    
    RAISE NOTICE 'Added % new unique cards to global table', (cards_count_after - cards_count_before);
    
    -- Create mapping table
    DROP TABLE IF EXISTS card_map;
    CREATE TEMP TABLE card_map AS
    SELECT r.id AS old_row_id, c.id AS card_id, r.user_id
    FROM cards_old r
    JOIN cards c
      ON c.language_pair_id = r.language_pair_id
     AND c.term = r.term
     AND c.translation = r.translation;
    
    CREATE INDEX ON card_map(old_row_id);
    
    -- Clear existing user_cards to start fresh
    TRUNCATE TABLE user_cards;
    
    -- Migrate user progress with state mapping
    INSERT INTO user_cards (
      user_id, card_id, state, progress, review_count, successful_reviews,
      direction, ease_factor, interval_days, due_at, last_reviewed_at, created_at, updated_at
    )
    SELECT DISTINCT
      m.user_id,
      m.card_id,
      CASE 
        WHEN r.state = 'KNOW' THEN 'REVIEW'
        WHEN r.state = 'LEARN' THEN 'LEARN'
        WHEN r.state = 'REVIEW' THEN 'REVIEW'
        WHEN r.state = 'SUSPENDED' THEN 'SUSPENDED'
        ELSE 'LEARN'
      END,
      COALESCE(r.progress, 0),
      COALESCE(r.review_count, 0),
      COALESCE(r.successful_reviews, 0),
      COALESCE(r.direction, 'K_TO_L'),
      COALESCE(r.ease_factor, 2.5),
      COALESCE(r.interval_days, 0),
      r.due_at,
      r.last_reviewed_at,
      r.created_at,
      r.updated_at
    FROM cards_old r
    JOIN card_map m ON m.old_row_id = r.id;
    
    SELECT COUNT(*) INTO user_cards_count FROM user_cards;
    
    RAISE NOTICE 'Migrated % user card records', user_cards_count;
  ELSE
    RAISE NOTICE 'No cards_old found - skipping data migration';
  END IF;
END $$;

-- Step 5: Enable RLS and create policies
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cards_read_policy" ON cards;
DROP POLICY IF EXISTS "cards_write_policy" ON cards;
DROP POLICY IF EXISTS "user_cards_owner_policy" ON user_cards;
DROP POLICY IF EXISTS "reviews_owner_policy" ON reviews;

-- Create policies
CREATE POLICY "cards_read_policy" ON cards FOR SELECT USING (true);
CREATE POLICY "cards_write_policy" ON cards FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "user_cards_owner_policy" ON user_cards FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_owner_policy" ON reviews FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Step 6: Create views
CREATE OR REPLACE VIEW user_cards_with_content AS
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
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

CREATE OR REPLACE VIEW cards_due_for_review AS
SELECT 
  uc.*,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.due_at <= now()
  AND uc.state = 'REVIEW';

-- Step 7: Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_user_cards_updated_at ON user_cards;
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Try to find existing card
  SELECT id INTO card_id
  FROM cards
  WHERE language_pair_id = p_language_pair_id
    AND term = p_term
    AND translation = p_translation;
  
  -- If not found, create new one
  IF card_id IS NULL THEN
    INSERT INTO cards (language_pair_id, term, translation, image_url)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url)
    RETURNING id INTO card_id;
  END IF;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO card_id;
  
  -- Add to user_cards if not exists
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
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  card_id BIGINT;
  is_new_user_card BOOLEAN;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO card_id;
  
  -- Check if user already has this card
  SELECT EXISTS(
    SELECT 1 FROM user_cards WHERE user_id = p_user_id AND card_id = card_id
  ) INTO is_new_user_card;
  
  -- Add to user_cards if not exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  -- Return result
  RETURN json_build_object(
    'card_id', card_id,
    'is_new_user_card', NOT is_new_user_card
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_card TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id TO authenticated;

-- Step 8: Final verification
DO $$
DECLARE
  final_cards_count INTEGER;
  final_user_cards_count INTEGER;
  final_cards_old_count INTEGER;
  has_duplicates BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO final_cards_count FROM cards;
  SELECT COUNT(*) INTO final_user_cards_count FROM user_cards;
  
  -- Check if cards_old still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cards_old' AND table_schema = 'public'
  ) THEN
    SELECT COUNT(*) INTO final_cards_old_count FROM cards_old;
  ELSE
    final_cards_old_count := 0;
  END IF;
  
  -- Check for duplicates
  SELECT EXISTS (
    SELECT 1 FROM user_cards
    GROUP BY user_id, card_id
    HAVING COUNT(*) > 1
  ) INTO has_duplicates;
  
  RAISE NOTICE '=== MIGRATION COMPLETED ===';
  RAISE NOTICE 'Global cards: %', final_cards_count;
  RAISE NOTICE 'User cards: %', final_user_cards_count;
  RAISE NOTICE 'Backup (cards_old): %', final_cards_old_count;
  RAISE NOTICE 'Has duplicates: %', has_duplicates;
  
  IF has_duplicates THEN
    RAISE WARNING 'WARNING: Duplicates detected in user_cards!';
  ELSE
    RAISE NOTICE 'SUCCESS: No duplicates found - migration completed successfully!';
  END IF;
END $$;
