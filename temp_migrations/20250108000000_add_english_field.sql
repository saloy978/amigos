/*
  # Add english field to cards table for three-language support

  1. Add `english` field to `cards` table
    - `english` (text, optional English translation)
    - This field will store the English word for image generation
    - Allows storing words in three languages: learning → known → english

  2. Update existing data
    - Set english field to translation for existing cards where language_pair_id contains 'en'
    - For other language pairs, leave english field as NULL initially

  3. Add index for better performance
    - Create index on english field for faster searches
*/

-- Add english field to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS english text;

-- Add comment to explain the field
COMMENT ON COLUMN cards.english IS 'English translation of the word, used for image generation and three-language support';

-- Update existing data where language pair includes English
UPDATE cards 
SET english = translation 
WHERE language_pair_id LIKE '%en%' 
  AND english IS NULL;

-- Create index for better performance on english field
CREATE INDEX IF NOT EXISTS idx_cards_english ON cards(english);

-- Add constraint to ensure english field is not empty when provided
ALTER TABLE cards ADD CONSTRAINT check_english_not_empty 
  CHECK (english IS NULL OR length(trim(english)) > 0);








