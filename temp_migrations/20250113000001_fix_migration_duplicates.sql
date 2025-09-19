/*
  # Fix Migration Duplicates
  
  This migration fixes the duplicate key issue by cleaning up duplicates
  in the old cards table before migration.
*/

-- First, let's check if we need to clean up duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
  total_cards INTEGER;
BEGIN
  -- Count total cards
  SELECT COUNT(*) INTO total_cards FROM cards_old;
  
  -- Count duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, language_pair_id, term, translation, COUNT(*) as cnt
    FROM cards_old
    GROUP BY user_id, language_pair_id, term, translation
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Total cards in old table: %', total_cards;
  RAISE NOTICE 'Duplicate entries found: %', duplicate_count;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Cleaning up duplicates...';
    
    -- Create a cleaned version of cards_old
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
    
    -- Drop the old table and rename the clean one
    DROP TABLE cards_old;
    ALTER TABLE cards_old_clean RENAME TO cards_old;
    
    RAISE NOTICE 'Duplicates cleaned up successfully';
  END IF;
END $$;

-- Now retry the migration of user_cards
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
