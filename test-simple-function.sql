-- Тест простой функции add_card_to_user
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- Замените 'your-user-id' на реальный ID пользователя из консоли
SELECT add_card_to_user(
  '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid, 
  'ru-es', 
  'тест2', 
  'prueba2', 
  null
) as result;

-- Проверяем, что карточка создалась
SELECT * FROM cards WHERE term = 'тест2' AND translation = 'prueba2';

-- Проверяем user_cards
SELECT * FROM user_cards WHERE user_id = '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid;


















