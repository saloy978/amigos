-- Исправление функций напрямую в Supabase Dashboard
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Исправляем функцию add_card_to_user
CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_card_id BIGINT;  -- Переименовали переменную чтобы избежать конфликта
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

-- 2. Исправляем функцию add_card_to_user_and_get_id
CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_card_id BIGINT;  -- Переименовали переменную чтобы избежать конфликта
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

-- 3. Предоставляем права
GRANT EXECUTE ON FUNCTION add_card_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id TO authenticated;

-- 4. Тестируем функцию
SELECT add_card_to_user(
  '7dd5dc5f-2e20-4107-8aee-302ad05772c2'::uuid, 
  'ru-es', 
  'тест', 
  'prueba', 
  null
) as result;


















