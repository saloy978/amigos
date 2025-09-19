-- Add english column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS english TEXT;
COMMENT ON COLUMN cards.english IS 'English translation of the word, used for image generation and three-language support';

-- Update existing cards to have english = translation where english is null
UPDATE cards 
SET english = translation 
WHERE english IS NULL;

-- Create index for english column
CREATE INDEX IF NOT EXISTS idx_cards_english ON cards(english);

-- Add constraint to ensure english is not empty if provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_english_not_empty'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT check_english_not_empty 
      CHECK (english IS NULL OR length(trim(english)) > 0);
  END IF;
END $$;



