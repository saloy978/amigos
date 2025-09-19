-- Check cards table structure
\d cards;

-- Check if cards table has id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cards' 
ORDER BY ordinal_position;



