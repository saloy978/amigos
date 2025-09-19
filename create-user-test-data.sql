-- Создание тестовых данных для пользователя
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Создаем настройки пользователя
INSERT INTO user_settings (user_id, language_pair_id, daily_goal, notifications_enabled, sound_enabled)
VALUES (
  auth.uid(),
  'ru-es',
  20,
  true,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  language_pair_id = EXCLUDED.language_pair_id,
  daily_goal = EXCLUDED.daily_goal,
  notifications_enabled = EXCLUDED.notifications_enabled,
  sound_enabled = EXCLUDED.sound_enabled;

-- 2. Создаем streak данные
INSERT INTO user_streak (user_id, current_streak, longest_streak, last_activity_date, total_days_used)
VALUES (
  auth.uid(),
  1,
  1,
  CURRENT_DATE,
  1
)
ON CONFLICT (user_id) DO UPDATE SET
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  last_activity_date = EXCLUDED.last_activity_date,
  total_days_used = EXCLUDED.total_days_used;

-- 3. Добавляем существующие карточки в user_cards
INSERT INTO user_cards (user_id, card_id, state, progress, review_count, successful_reviews, direction, ease_factor, interval_days, due_at)
SELECT 
  auth.uid(),
  c.id,
  'LEARN',
  0,
  0,
  0,
  'K_TO_L',
  2.5,
  0,
  now()
FROM cards c
WHERE c.language_pair_id = 'ru-es'
  AND NOT EXISTS (
    SELECT 1 FROM user_cards uc 
    WHERE uc.user_id = auth.uid() 
    AND uc.card_id = c.id
  );

-- 4. Проверяем созданные данные
SELECT 'user_settings' as table_name, * FROM user_settings WHERE user_id = auth.uid()
UNION ALL
SELECT 'user_streak' as table_name, * FROM user_streak WHERE user_id = auth.uid();

-- 5. Проверяем user_cards
SELECT 
  COUNT(*) as total_user_cards,
  COUNT(CASE WHEN state = 'LEARN' THEN 1 END) as learn_cards
FROM user_cards 
WHERE user_id = auth.uid();


















