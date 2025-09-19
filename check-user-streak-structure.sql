-- Проверка структуры таблицы user_streak
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем структуру таблицы user_streak
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_streak' 
ORDER BY ordinal_position;















