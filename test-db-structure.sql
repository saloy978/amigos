-- Test database structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cards' 
ORDER BY ordinal_position;

-- Test if the function works
SELECT get_or_create_card('ru-es', 'test', 'тест', null, 'test');

-- Test the add_card_to_user_with_lesson function
SELECT add_card_to_user_with_lesson('ru-es', 'test2', 'тест2', null, 'test2', 'intro', 1);



