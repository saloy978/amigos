-- Диагностика проблемы с миграцией
-- Запустите эти запросы в Supabase SQL Editor

-- 1. Проверить, существует ли таблица cards_old
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cards_old'
) as cards_old_exists;

-- 2. Если cards_old существует, проверить дубликаты
SELECT 
  user_id, 
  language_pair_id, 
  term, 
  translation, 
  COUNT(*) as duplicate_count
FROM cards_old
GROUP BY user_id, language_pair_id, term, translation
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 3. Проверить, какие таблицы существуют
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cards', 'cards_old', 'user_cards', 'reviews')
ORDER BY table_name;

-- 4. Если user_cards существует, проверить дубликаты там
SELECT 
  user_id, 
  card_id, 
  COUNT(*) as duplicate_count
FROM user_cards
GROUP BY user_id, card_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 5. Общая статистика
SELECT 
  'cards_old' as table_name,
  COUNT(*) as row_count
FROM cards_old
UNION ALL
SELECT 
  'cards' as table_name,
  COUNT(*) as row_count
FROM cards
UNION ALL
SELECT 
  'user_cards' as table_name,
  COUNT(*) as row_count
FROM user_cards;


















