-- Тест доступа пользователя к таблицам
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем текущего пользователя
SELECT auth.uid() as current_user_id;

-- 2. Проверяем данные в user_settings
SELECT * FROM user_settings WHERE user_id = auth.uid();

-- 3. Проверяем данные в user_streak
SELECT * FROM user_streak WHERE user_id = auth.uid();

-- 4. Проверяем данные в user_cards
SELECT * FROM user_cards WHERE user_id = auth.uid() LIMIT 5;

-- 5. Проверяем данные в cards
SELECT * FROM cards LIMIT 5;


















