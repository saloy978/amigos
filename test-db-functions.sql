-- Тестирование функций базы данных
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Тестируем функцию get_or_create_card
SELECT get_or_create_card('ru-es', 'тест', 'prueba', null) as card_id;

-- 2. Тестируем функцию add_card_to_user_and_get_id
-- Замените 'your-user-id' на реальный ID пользователя
SELECT add_card_to_user_and_get_id(
  'your-user-id'::uuid, 
  'ru-es', 
  'тест2', 
  'prueba2', 
  null
) as result;

-- 3. Проверяем, что карточки создались
SELECT * FROM cards WHERE language_pair_id = 'ru-es';

-- 4. Проверяем user_cards (если есть пользователь)
SELECT * FROM user_cards;

-- 5. Проверяем представление user_cards_with_content
SELECT * FROM user_cards_with_content;


















