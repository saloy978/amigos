-- Полный сброс и повторная миграция
-- ВНИМАНИЕ: Этот скрипт удалит все новые таблицы и начнет заново

-- Step 1: Удалить новые таблицы
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;

-- Step 2: Восстановить старую таблицу
ALTER TABLE cards_old RENAME TO cards;

-- Step 3: Теперь применить безопасную миграцию
-- (Скопируйте содержимое supabase/migrations/20250113000002_safe_migration.sql)

-- Проверка состояния
SELECT 
  'cards' as table_name,
  COUNT(*) as row_count
FROM cards
UNION ALL
SELECT 
  'cards_old' as table_name,
  COUNT(*) as row_count
FROM cards_old;