-- Исправление user_streak с конкретным user_id
-- Замените 'YOUR_USER_ID_HERE' на реальный ID пользователя из консоли браузера
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем структуру таблицы user_streak
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_streak' 
ORDER BY ordinal_position;

-- 2. Проверяем существующие RLS политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_streak';

-- 3. Создаем RLS политику для user_streak если её нет
DO $$
BEGIN
    -- Проверяем, существует ли политика
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_streak' 
        AND policyname = 'user_streak_owner_policy'
    ) THEN
        -- Создаем политику
        CREATE POLICY user_streak_owner_policy ON user_streak
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        
        RAISE NOTICE 'RLS policy created for user_streak';
    ELSE
        RAISE NOTICE 'RLS policy already exists for user_streak';
    END IF;
END $$;

-- 4. ВРЕМЕННО: Создаем запись для конкретного пользователя
-- Замените '7dd5dc5f-2e20-4107-8aee-302ad05772c2' на ваш user_id из консоли браузера
INSERT INTO user_streak (user_id, current_streak, longest_streak, last_activity_date)
VALUES (
    '7dd5dc5f-2e20-4107-8aee-302ad05772c2', -- Замените на ваш user_id
    1,
    1,
    CURRENT_DATE
)
ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    last_activity_date = EXCLUDED.last_activity_date;

-- 5. Проверяем результат
SELECT * FROM user_streak WHERE user_id = '7dd5dc5f-2e20-4107-8aee-302ad05772c2';















