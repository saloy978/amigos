-- Диагностика дубликатов в текущей схеме cards
-- Запустите эти запросы в Supabase SQL Editor для анализа

-- 1. Внутри одного пользователя (на случай повторных импортов):
SELECT 
  user_id, 
  language_pair_id, 
  term, 
  translation, 
  COUNT(*) as duplicate_count
FROM cards
GROUP BY 1,2,3,4
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. Между пользователями — это и есть симптом текущего дизайна 
-- (одна и та же карточка размножена):
SELECT 
  language_pair_id, 
  term, 
  translation, 
  COUNT(DISTINCT user_id) AS users_count,
  COUNT(*) as total_cards
FROM cards
GROUP BY 1,2,3
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY users_count DESC, total_cards DESC;

-- 3. Общая статистика дубликатов:
SELECT 
  'Total cards' as metric,
  COUNT(*) as count
FROM cards
UNION ALL
SELECT 
  'Unique card content' as metric,
  COUNT(DISTINCT language_pair_id, term, translation) as count
FROM cards
UNION ALL
SELECT 
  'Duplicate cards' as metric,
  COUNT(*) - COUNT(DISTINCT language_pair_id, term, translation) as count
FROM cards;

-- 4. Топ-10 самых дублируемых карточек:
SELECT 
  language_pair_id,
  term,
  translation,
  COUNT(DISTINCT user_id) as users_count,
  COUNT(*) as total_cards
FROM cards
GROUP BY 1,2,3
ORDER BY users_count DESC, total_cards DESC
LIMIT 10;

-- 5. Статистика по пользователям:
SELECT 
  user_id,
  COUNT(*) as total_cards,
  COUNT(DISTINCT language_pair_id, term, translation) as unique_cards,
  COUNT(*) - COUNT(DISTINCT language_pair_id, term, translation) as duplicates
FROM cards
GROUP BY user_id
ORDER BY duplicates DESC;


















