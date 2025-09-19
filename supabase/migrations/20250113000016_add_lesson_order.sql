-- Add lesson_order field to user_cards table
-- This field will store the order of words from lessons

-- Add lesson_order column to user_cards table
ALTER TABLE user_cards 
ADD COLUMN lesson_order INTEGER DEFAULT NULL;

-- Add lesson_id column to track which lesson the card came from
ALTER TABLE user_cards 
ADD COLUMN lesson_id TEXT DEFAULT NULL;

-- Create index for lesson order queries
CREATE INDEX idx_user_cards_lesson_order ON user_cards(user_id, lesson_id, lesson_order) 
WHERE lesson_order IS NOT NULL;

-- Drop and recreate the view to include new fields
DROP VIEW IF EXISTS user_cards_with_content;

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
  uc.lesson_order,
  uc.lesson_id,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

-- Update the add_card_to_user function to accept lesson parameters
CREATE OR REPLACE FUNCTION add_card_to_user_with_lesson(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL,
  p_lesson_id TEXT DEFAULT NULL,
  p_lesson_order INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  card_id BIGINT;
  is_new_user_card BOOLEAN;
  current_user_id UUID;
BEGIN
  -- Get current user ID from auth
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  -- Check if user already has this card
  SELECT EXISTS(
    SELECT 1 FROM user_cards WHERE user_id = current_user_id AND card_id = card_id
  ) INTO is_new_user_card;
  
  -- Add to user_cards if not exists, with lesson info
  INSERT INTO user_cards (user_id, card_id, lesson_id, lesson_order)
  VALUES (current_user_id, card_id, p_lesson_id, p_lesson_order)
  ON CONFLICT (user_id, card_id) DO UPDATE SET
    lesson_id = COALESCE(EXCLUDED.lesson_id, user_cards.lesson_id),
    lesson_order = COALESCE(EXCLUDED.lesson_order, user_cards.lesson_order);
  
  -- Return result
  RETURN json_build_object(
    'card_id', card_id,
    'is_new_user_card', NOT is_new_user_card
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_card_to_user_with_lesson TO authenticated;

-- Add comment
COMMENT ON COLUMN user_cards.lesson_order IS 'Order of the word in the lesson (1-based)';
COMMENT ON COLUMN user_cards.lesson_id IS 'ID of the lesson this card came from';
