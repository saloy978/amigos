-- Прямой тест функции add_card_to_user_and_get_id
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- Замените 'your-user-id' на реальный ID пользователя из консоли
-- (например: 7dd5dc5f-2e20-4107-8aee-302ad05772c2)

SELECT add_card_to_user_and_get_id(
  '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid, 
  'ru-es', 
  'тест', 
  'prueba', 
  null
) as result;

-- Проверяем, что карточка создалась
SELECT * FROM cards WHERE term = 'тест' AND translation = 'prueba';

-- Проверяем user_cards
SELECT * FROM user_cards WHERE user_id = '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid;


















