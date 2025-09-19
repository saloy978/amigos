-- Исправление "битых" записей в user_cards
-- Удаляем записи, которые ссылаются на несуществующие карточки

-- 1. Сначала проверим, сколько "битых" записей
SELECT COUNT(*) as broken_records
FROM user_cards uc
LEFT JOIN cards c ON c.id = uc.card_id
WHERE c.id IS NULL;

-- 2. Покажем все проблемные card_id
SELECT DISTINCT uc.card_id
FROM user_cards uc
LEFT JOIN cards c ON c.id = uc.card_id
WHERE c.id IS NULL
ORDER BY uc.card_id;

-- 3. Удаляем все "битые" записи
DELETE FROM user_cards 
WHERE card_id NOT IN (SELECT id FROM cards);

-- 4. Проверяем результат
SELECT COUNT(*) as total_user_cards
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

-- 5. Проверяем, что все записи теперь корректные
SELECT 
  uc.card_id,
  c.term,
  c.translation,
  uc.progress,
  uc.state
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
ORDER BY uc.card_id;














