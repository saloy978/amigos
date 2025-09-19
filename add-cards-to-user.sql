-- Добавляем карточки пользователю для тестирования
-- Замените 'YOUR_USER_ID' на реальный ID пользователя

-- 1. Сначала найдем ID текущего пользователя
SELECT auth.uid() as current_user_id;

-- 2. Добавим несколько карточек пользователю
INSERT INTO user_cards (user_id, card_id, state, progress, review_count, successful_reviews, direction, ease_factor, interval_days, due_at, created_at, updated_at)
SELECT 
  auth.uid() as user_id,
  c.id as card_id,
  'LEARN' as state,
  0 as progress,
  0 as review_count,
  0 as successful_reviews,
  'K_TO_L' as direction,
  2.5 as ease_factor,
  0 as interval_days,
  NULL as due_at,  -- NULL означает, что карточка готова к показу
  now() as created_at,
  now() as updated_at
FROM cards c
WHERE c.id IN (83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101)
ON CONFLICT (user_id, card_id) DO NOTHING;

-- 3. Проверим результат
SELECT 
  uc.user_id,
  uc.card_id,
  c.term,
  c.translation,
  uc.progress,
  uc.state,
  uc.due_at
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.user_id = auth.uid()
ORDER BY uc.card_id;














