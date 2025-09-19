-- Проверка созданной схемы базы данных
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем все созданные таблицы
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cards', 'user_cards', 'reviews', 'user_settings', 'lesson_progress', 'user_streak')
ORDER BY table_name;

-- 2. Проверяем структуру таблицы cards
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cards' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем структуру таблицы user_cards
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_cards' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Проверяем индексы
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('cards', 'user_cards', 'reviews', 'user_settings', 'lesson_progress', 'user_streak')
ORDER BY tablename, indexname;

-- 5. Проверяем функции
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_or_create_card', 'add_card_to_user', 'add_card_to_user_and_get_id', 'update_updated_at_column')
ORDER BY routine_name;

-- 6. Проверяем представления (views)
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name;

-- 7. Проверяем политики RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Проверяем количество записей в каждой таблице
SELECT 
  'cards' as table_name,
  COUNT(*) as row_count
FROM cards
UNION ALL
SELECT 
  'user_cards' as table_name,
  COUNT(*) as row_count
FROM user_cards
UNION ALL
SELECT 
  'reviews' as table_name,
  COUNT(*) as row_count
FROM reviews
UNION ALL
SELECT 
  'user_settings' as table_name,
  COUNT(*) as row_count
FROM user_settings
UNION ALL
SELECT 
  'lesson_progress' as table_name,
  COUNT(*) as row_count
FROM lesson_progress
UNION ALL
SELECT 
  'user_streak' as table_name,
  COUNT(*) as row_count
FROM user_streak;


















