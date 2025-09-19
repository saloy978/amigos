-- Исправление проблем с user_streak таблицей
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

-- 4. Проверяем, есть ли данные для текущего пользователя
SELECT * FROM user_streak WHERE user_id = auth.uid();

-- 5. Если данных нет, создаем запись для текущего пользователя
INSERT INTO user_streak (user_id, current_streak, longest_streak, last_activity_date)
VALUES (
    auth.uid(),
    1,
    1,
    CURRENT_DATE
)
ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    last_activity_date = EXCLUDED.last_activity_date;

-- 6. Проверяем результат
SELECT * FROM user_streak WHERE user_id = auth.uid();
