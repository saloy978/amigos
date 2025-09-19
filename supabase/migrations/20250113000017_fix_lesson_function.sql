-- Fix lesson function - completely rewrite it
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS add_card_to_user_with_lesson;

-- Create a completely new, simple function
CREATE OR REPLACE FUNCTION add_card_to_user_with_lesson(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL,
  p_lesson_id TEXT DEFAULT NULL,
  p_lesson_order INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_card_id BIGINT;
  current_user_id UUID;
  existing_user_card_exists BOOLEAN;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Log the function call
  RAISE NOTICE 'Adding card for user %: % -> % (lesson: %, order: %)', 
    current_user_id, p_term, p_translation, p_lesson_id, p_lesson_order;
  
  -- Get or create the card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) 
  INTO new_card_id;
  
  RAISE NOTICE 'Card ID: %', new_card_id;
  
  -- Check if user already has this card
  SELECT EXISTS(
    SELECT 1 FROM user_cards 
    WHERE user_cards.user_id = current_user_id AND user_cards.card_id = new_card_id
  ) INTO existing_user_card_exists;
  
  IF existing_user_card_exists THEN
    -- Update existing user card with lesson info
    UPDATE user_cards 
    SET 
      lesson_id = COALESCE(p_lesson_id, user_cards.lesson_id),
      lesson_order = COALESCE(p_lesson_order, user_cards.lesson_order),
      updated_at = NOW()
    WHERE user_cards.user_id = current_user_id AND user_cards.card_id = new_card_id;
    
    RAISE NOTICE 'Updated existing user card for user % and card %', current_user_id, new_card_id;
    
    result := json_build_object(
      'card_id', new_card_id,
      'user_id', current_user_id,
      'is_new', false,
      'message', 'Card updated with lesson info'
    );
  ELSE
    -- Create new user card
    INSERT INTO user_cards (
      user_id, 
      card_id, 
      lesson_id, 
      lesson_order,
      state,
      progress,
      review_count,
      successful_reviews,
      direction,
      ease_factor,
      interval_days,
      due_at,
      created_at,
      updated_at
    ) VALUES (
      current_user_id,
      new_card_id,
      p_lesson_id,
      p_lesson_order,
      'LEARN',
      0,
      0,
      0,
      'K_TO_L',
      2.5,
      0,
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created new user card for user % and card %', current_user_id, new_card_id;
    
    result := json_build_object(
      'card_id', new_card_id,
      'user_id', current_user_id,
      'is_new', true,
      'message', 'New card added with lesson info'
    );
  END IF;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in add_card_to_user_with_lesson: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_card_to_user_with_lesson TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION add_card_to_user_with_lesson IS 'Adds a card to user collection with lesson information';
