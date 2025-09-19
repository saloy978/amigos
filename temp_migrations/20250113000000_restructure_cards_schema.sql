/*
  # Restructure Cards Schema - Separate Content and Progress
  
  This migration restructures the cards system to separate content (cards) 
  from user progress (user_cards), eliminating duplication and improving 
  data normalization.
  
  Changes:
  1. Rename current cards table to cards_old (backup)
  2. Create new cards table (global content library)
  3. Create user_cards table (personal progress)
  4. Create reviews table (optional review history)
  5. Migrate data from old structure to new structure
  6. Add proper indexes and constraints
  7. Set up RLS policies
*/

-- Step 1: Backup current cards table
ALTER TABLE cards RENAME TO cards_old;

-- Step 2: Create new cards table (global content library)
CREATE TABLE cards (
  id              BIGSERIAL PRIMARY KEY,
  language_pair_id TEXT NOT NULL,
  term            TEXT NOT NULL,
  translation     TEXT NOT NULL,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create user_cards table (personal progress)
CREATE TABLE user_cards (
  user_id          UUID    NOT NULL,
  card_id          BIGINT  NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  state            TEXT    NOT NULL DEFAULT 'LEARN',
  progress         INT     NOT NULL DEFAULT 0,
  review_count     INT     NOT NULL DEFAULT 0,
  successful_reviews INT   NOT NULL DEFAULT 0,
  direction        TEXT    NOT NULL DEFAULT 'K_TO_L',
  ease_factor      NUMERIC NOT NULL DEFAULT 2.5,
  interval_days    INT     NOT NULL DEFAULT 0,
  due_at           TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

-- Step 4: Create reviews table (optional review history)
CREATE TABLE reviews (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID    NOT NULL,
  card_id      BIGINT  NOT NULL REFERENCES cards(id),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating       SMALLINT NOT NULL,
  prev_interval INT,
  next_interval INT,
  prev_ef       NUMERIC,
  next_ef       NUMERIC
);

-- Step 5: Add constraints and indexes
-- Unique constraint to prevent duplicate cards
CREATE UNIQUE INDEX cards_uniq
  ON cards(language_pair_id, term, translation);

-- Check constraints for user_cards
ALTER TABLE user_cards ADD CONSTRAINT user_cards_state_check 
  CHECK (state IN ('LEARN', 'KNOW', 'MASTERED'));

ALTER TABLE user_cards ADD CONSTRAINT user_cards_direction_check 
  CHECK (direction IN ('K_TO_L', 'L_TO_K'));

ALTER TABLE user_cards ADD CONSTRAINT user_cards_progress_check 
  CHECK (progress >= 0 AND progress <= 100);

-- Check constraints for reviews
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check 
  CHECK (rating >= 1 AND rating <= 5);

-- Performance indexes
CREATE INDEX user_cards_due_idx
  ON user_cards(user_id, due_at)
  WHERE state <> 'MASTERED';

CREATE INDEX user_cards_user_state_idx
  ON user_cards(user_id, state);

CREATE INDEX reviews_user_card_idx
  ON reviews(user_id, card_id, reviewed_at DESC);

CREATE INDEX reviews_user_reviewed_at_idx
  ON reviews(user_id, reviewed_at DESC);

-- Step 6: Migrate data from old structure
-- First, insert unique cards into new cards table
WITH uniq AS (
  SELECT DISTINCT
    language_pair_id,
    trim(term) AS term,
    trim(translation) AS translation,
    image_url
  FROM cards_old
)
INSERT INTO cards (language_pair_id, term, translation, image_url)
SELECT language_pair_id, term, translation, image_url
FROM uniq
ON CONFLICT (language_pair_id, term, translation) DO NOTHING;

-- Create mapping table for old to new card IDs
CREATE TEMP TABLE card_map AS
SELECT r.id AS old_row_id, c.id AS card_id, r.user_id
FROM cards_old r
JOIN cards c
  ON c.language_pair_id = r.language_pair_id
 AND c.term = r.term
 AND c.translation = r.translation;

CREATE INDEX ON card_map(old_row_id);

-- Check for potential duplicates in old data
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, language_pair_id, term, translation, COUNT(*) as cnt
    FROM cards_old
    GROUP BY user_id, language_pair_id, term, translation
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate card entries in old data', duplicate_count;
  END IF;
END $$;

-- Migrate user progress to user_cards (with duplicate handling)
INSERT INTO user_cards (
  user_id, card_id, state, progress, review_count, successful_reviews,
  direction, ease_factor, interval_days, due_at, last_reviewed_at, created_at, updated_at
)
SELECT
  m.user_id,
  m.card_id,
  COALESCE(r.state, 'LEARN'),
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
JOIN card_map m ON m.old_row_id = r.id
ON CONFLICT (user_id, card_id) DO UPDATE SET
  state = EXCLUDED.state,
  progress = EXCLUDED.progress,
  review_count = EXCLUDED.review_count,
  successful_reviews = EXCLUDED.successful_reviews,
  direction = EXCLUDED.direction,
  ease_factor = EXCLUDED.ease_factor,
  interval_days = EXCLUDED.interval_days,
  due_at = EXCLUDED.due_at,
  last_reviewed_at = EXCLUDED.last_reviewed_at,
  updated_at = now();

-- Step 7: Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Cards table: Read access for all authenticated users, write for service role
CREATE POLICY "Cards are readable by authenticated users"
  ON cards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cards are writable by service role"
  ON cards
  FOR ALL
  TO service_role
  USING (true);

-- User cards: Full access only to owner
CREATE POLICY "User cards are accessible by owner"
  ON user_cards
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reviews: Full access only to owner
CREATE POLICY "Reviews are accessible by owner"
  ON reviews
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 9: Create triggers for updated_at
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add helpful views for common queries
-- View for user's cards with content
CREATE VIEW user_cards_with_content AS
SELECT 
  uc.user_id,
  uc.card_id,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url,
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
  uc.updated_at
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

-- View for cards due for review
CREATE VIEW cards_due_for_review AS
SELECT 
  uc.user_id,
  uc.card_id,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url,
  uc.state,
  uc.progress,
  uc.direction,
  uc.due_at
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.due_at <= now()
  AND uc.state IN ('LEARN', 'KNOW');

-- Step 11: Grant permissions
GRANT SELECT ON user_cards_with_content TO authenticated;
GRANT SELECT ON cards_due_for_review TO authenticated;

-- Step 12: Add helpful functions
-- Function to get or create a card
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Try to find existing card
  SELECT id INTO card_id
  FROM cards
  WHERE language_pair_id = p_language_pair_id
    AND term = p_term
    AND translation = p_translation;
  
  -- If not found, create new card
  IF card_id IS NULL THEN
    INSERT INTO cards (language_pair_id, term, translation, image_url)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url)
    RETURNING id INTO card_id;
  END IF;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add card to user's collection
CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Get or create card
  card_id := get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url);
  
  -- Add to user's collection if not already exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_card TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user TO authenticated;

-- Step 13: Add comments for documentation
COMMENT ON TABLE cards IS 'Global library of flashcard content (shared across all users)';
COMMENT ON TABLE user_cards IS 'Personal progress and state for each user''s cards';
COMMENT ON TABLE reviews IS 'History of card reviews for spaced repetition algorithm';
COMMENT ON VIEW user_cards_with_content IS 'User cards joined with card content for easy querying';
COMMENT ON VIEW cards_due_for_review IS 'Cards that are due for review by the user';
COMMENT ON FUNCTION get_or_create_card IS 'Gets existing card or creates new one, returns card_id';
COMMENT ON FUNCTION add_card_to_user IS 'Adds a card to user''s collection, creating card if needed';

-- Step 14: Create indexes for better performance on common queries
CREATE INDEX idx_cards_language_pair ON cards(language_pair_id);
CREATE INDEX idx_cards_term ON cards(term);
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
