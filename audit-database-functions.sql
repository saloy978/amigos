-- Аудит всех функций в базе данных
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем все функции
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- 2. Проверяем конкретные функции для карточек
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_or_create_card', 
    'add_card_to_user', 
    'add_card_to_user_and_get_id', 
    'update_updated_at_column'
  )
ORDER BY routine_name;

-- 3. Проверяем представления
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 4. Проверяем таблицы
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


















