-- Fix ambiguous column reference in add_card_to_user function
-- The issue is that card_id variable conflicts with card_id column in user_cards table

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_card_id BIGINT;  -- Renamed variable to avoid conflict
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO v_card_id;
  
  -- Add to user_cards if not exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, v_card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the add_card_to_user_and_get_id function
CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_card_id BIGINT;  -- Renamed variable to avoid conflict
  is_new_user_card BOOLEAN;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO v_card_id;
  
  -- Check if user already has this card
  SELECT EXISTS(
    SELECT 1 FROM user_cards WHERE user_id = p_user_id AND card_id = v_card_id
  ) INTO is_new_user_card;
  
  -- Add to user_cards if not exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, v_card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  -- Return result
  RETURN json_build_object(
    'card_id', v_card_id,
    'is_new_user_card', NOT is_new_user_card
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_card_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id TO authenticated;


















