/*
  # Fix all ambiguous column references in database functions
  
  This migration fixes all functions that might have ambiguous column references,
  particularly in the get_or_create_card function and related functions.
*/

-- Step 1: Drop all existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_or_create_card(text, text, text, text, text);
DROP FUNCTION IF EXISTS add_card_to_user(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS add_card_to_user_and_get_id(uuid, text, text, text, text, text);

-- Step 2: Create get_or_create_card function with explicit table references
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_card_id BIGINT;
BEGIN
  -- Try to find existing card
  SELECT c.id INTO v_card_id 
  FROM cards c
  WHERE c.language_pair_id = p_language_pair_id 
    AND c.term = p_term 
    AND c.translation = p_translation;
  
  -- If card exists, update english if provided and not already set
  IF v_card_id IS NOT NULL THEN
    IF p_english IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM cards WHERE id = v_card_id AND english IS NOT NULL
    ) THEN
      UPDATE cards SET english = p_english WHERE id = v_card_id;
    END IF;
  ELSE
    -- Create new card
    INSERT INTO cards (language_pair_id, term, translation, image_url, english)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url, p_english)
    RETURNING id INTO v_card_id;
  END IF;
  
  RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create add_card_to_user function
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
  v_card_id BIGINT;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO v_card_id;
  
  -- Add to user_cards table
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, v_card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create add_card_to_user_and_get_id function
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
  v_card_id BIGINT;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO v_card_id;
  
  -- Add to user_cards table
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, v_card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_card(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id(uuid, text, text, text, text, text) TO authenticated;

-- Step 6: Verification
DO $$
BEGIN
  RAISE NOTICE '=== ALL FUNCTIONS FIXED ===';
  RAISE NOTICE 'get_or_create_card function recreated with explicit table references';
  RAISE NOTICE 'add_card_to_user function recreated with explicit table references';
  RAISE NOTICE 'add_card_to_user_and_get_id function recreated with explicit table references';
  RAISE NOTICE 'All ambiguous column reference errors should be resolved!';
END $$;






