/*
  # Safe Migration - Handle Duplicates Properly
  
  This migration safely handles duplicates by cleaning them up first,
  then performing the migration step by step.
*/

-- Step 1: Check current state
DO $$
DECLARE
  cards_old_count INTEGER;
  cards_count INTEGER;
  user_cards_count INTEGER;
BEGIN
  -- Check if cards_old exists
  SELECT COUNT(*) INTO cards_old_count FROM cards_old;
  
  -- Check if new tables exist
  SELECT COUNT(*) INTO cards_count FROM cards;
  SELECT COUNT(*) INTO user_cards_count FROM user_cards;
  
  RAISE NOTICE 'Current state:';
  RAISE NOTICE '  cards_old: % rows', cards_old_count;
  RAISE NOTICE '  cards: % rows', cards_count;
  RAISE NOTICE '  user_cards: % rows', user_cards_count;
END $$;

-- Step 2: Clean up duplicates in cards_old if they exist
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, language_pair_id, term, translation, COUNT(*) as cnt
    FROM cards_old
    GROUP BY user_id, language_pair_id, term, translation
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate entries, cleaning up...', duplicate_count;
    
    -- Create a clean version without duplicates
    CREATE TEMP TABLE cards_old_clean AS
    SELECT DISTINCT ON (user_id, language_pair_id, term, translation)
      id,
      user_id,
      language_pair_id,
      term,
      translation,
      image_url,
      progress,
      state,
      due_at,
      review_count,
      successful_reviews,
      direction,
      ease_factor,
      interval_days,
      last_reviewed_at,
      created_at,
      updated_at
    FROM cards_old
    ORDER BY user_id, language_pair_id, term, translation, created_at DESC;
    
    -- Replace the old table
    DROP TABLE cards_old;
    ALTER TABLE cards_old_clean RENAME TO cards_old;
    
    RAISE NOTICE 'Duplicates cleaned up successfully';
  ELSE
    RAISE NOTICE 'No duplicates found in cards_old';
  END IF;
END $$;

-- Step 3: Ensure cards table is populated (if not already done)
INSERT INTO cards (language_pair_id, term, translation, image_url)
SELECT DISTINCT
  language_pair_id,
  trim(term) AS term,
  trim(translation) AS translation,
  image_url
FROM cards_old
ON CONFLICT (language_pair_id, term, translation) DO NOTHING;

-- Step 4: Create mapping table
DROP TABLE IF EXISTS card_map;
CREATE TEMP TABLE card_map AS
SELECT r.id AS old_row_id, c.id AS card_id, r.user_id
FROM cards_old r
JOIN cards c
  ON c.language_pair_id = r.language_pair_id
 AND c.term = r.term
 AND c.translation = r.translation;

CREATE INDEX ON card_map(old_row_id);

-- Step 5: Clear existing user_cards if any (to start fresh)
TRUNCATE TABLE user_cards;

-- Step 6: Migrate user_cards with proper duplicate handling
INSERT INTO user_cards (
  user_id, card_id, state, progress, review_count, successful_reviews,
  direction, ease_factor, interval_days, due_at, last_reviewed_at, created_at, updated_at
)
SELECT DISTINCT
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
JOIN card_map m ON m.old_row_id = r.id;

-- Step 7: Verify the migration
DO $$
DECLARE
  final_cards_count INTEGER;
  final_user_cards_count INTEGER;
  final_cards_old_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO final_cards_count FROM cards;
  SELECT COUNT(*) INTO final_user_cards_count FROM user_cards;
  SELECT COUNT(*) INTO final_cards_old_count FROM cards_old;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '  cards: % rows', final_cards_count;
  RAISE NOTICE '  user_cards: % rows', final_user_cards_count;
  RAISE NOTICE '  cards_old: % rows (backup)', final_cards_old_count;
  
  -- Check for any remaining duplicates
  IF EXISTS (
    SELECT 1 FROM user_cards
    GROUP BY user_id, card_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING 'WARNING: Duplicates still exist in user_cards!';
  ELSE
    RAISE NOTICE 'No duplicates found in user_cards - migration successful!';
  END IF;
END $$;