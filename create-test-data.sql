-- Создание тестовых данных для пользователя
-- Выполните этот запрос в Supabase Dashboard → SQL Editor
-- Замените 'your-user-id' на реальный ID пользователя из консоли

-- 1. Создаем настройки пользователя
INSERT INTO user_settings (user_id, language_pair_id, daily_goal, notifications_enabled, sound_enabled)
VALUES (
  '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid,
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
  '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid,
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

-- 3. Проверяем созданные данные
SELECT 'user_settings' as table_name, * FROM user_settings WHERE user_id = '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid
UNION ALL
SELECT 'user_streak' as table_name, * FROM user_streak WHERE user_id = '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid;


















