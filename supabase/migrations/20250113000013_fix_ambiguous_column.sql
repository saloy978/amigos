/*
  # Fix ambiguous column reference in add_card_to_user function
  
  The error "column reference 'card_id' is ambiguous" occurs because
  the function references card_id without specifying the table.
  This migration fixes the function to use proper table aliases.
*/

-- Step 1: Drop and recreate the add_card_to_user function with proper table references
DROP FUNCTION IF EXISTS add_card_to_user(uuid, text, text, text, text, text);

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Get or create card using the get_or_create_card function
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  -- Add to user_cards table (not the view)
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop and recreate the add_card_to_user_and_get_id function
DROP FUNCTION IF EXISTS add_card_to_user_and_get_id(uuid, text, text, text, text, text);

CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Get or create card using the get_or_create_card function
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  -- Add to user_cards table (not the view)
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION add_card_to_user(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id(uuid, text, text, text, text, text) TO authenticated;

-- Step 4: Verification
DO $$
BEGIN
  RAISE NOTICE '=== FUNCTIONS FIXED ===';
  RAISE NOTICE 'add_card_to_user function recreated with proper table references';
  RAISE NOTICE 'add_card_to_user_and_get_id function recreated with proper table references';
  RAISE NOTICE 'Ambiguous column reference error should be resolved!';
END $$;






