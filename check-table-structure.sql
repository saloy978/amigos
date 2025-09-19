-- Check the structure of user_cards table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_cards' 
AND table_schema = 'public'
ORDER BY ordinal_position;



