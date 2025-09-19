-- Fix cards_due_for_review view to include cards with NULL due_at
-- These cards should be considered immediately due for review

DROP VIEW IF EXISTS cards_due_for_review;

CREATE VIEW cards_due_for_review AS
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
JOIN cards c ON c.id = uc.card_id
WHERE (uc.due_at IS NULL OR uc.due_at <= now())
  AND uc.state = 'LEARN';

-- Grant permissions
GRANT SELECT ON cards_due_for_review TO authenticated;














