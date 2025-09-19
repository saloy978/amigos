-- Проверка текущего состояния базы данных
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- Проверяем существующие таблицы
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cards', 'cards_old', 'user_cards', 'reviews')
ORDER BY tablename;

-- Проверяем структуру таблицы cards (если существует)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cards' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Проверяем количество записей в cards
SELECT COUNT(*) as cards_count FROM cards;

-- Проверяем есть ли user_id в таблице cards
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'cards' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN 'user_id EXISTS - old schema'
    ELSE 'user_id NOT EXISTS - new schema or no cards table'
  END as schema_status;


















