-- Check user_cards table structure
\d user_cards;

-- Check if user_cards table has id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_cards' 
ORDER BY ordinal_position;



