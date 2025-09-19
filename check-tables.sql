-- Проверка существующих таблиц
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем все таблицы
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Проверяем структуру user_settings
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- 3. Проверяем данные в user_settings
SELECT * FROM user_settings LIMIT 5;


















