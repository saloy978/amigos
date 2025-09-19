-- Проверка user_cards для текущего пользователя
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем user_cards для текущего пользователя
SELECT 
  uc.*,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON uc.card_id = c.id
WHERE uc.user_id = auth.uid()
ORDER BY uc.created_at DESC;

-- 2. Проверяем представление user_cards_with_content
SELECT * FROM user_cards_with_content 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 3. Проверяем количество карточек
SELECT 
  COUNT(*) as total_cards,
  COUNT(CASE WHEN state = 'LEARN' THEN 1 END) as learn_cards,
  COUNT(CASE WHEN state = 'REVIEW' THEN 1 END) as review_cards,
  COUNT(CASE WHEN state = 'SUSPENDED' THEN 1 END) as suspended_cards
FROM user_cards 
WHERE user_id = auth.uid();


















