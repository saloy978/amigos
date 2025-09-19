-- Исправление политики для обновления карточек
-- Позволяет аутентифицированным пользователям обновлять карточки

-- Удаляем старую политику
DROP POLICY IF EXISTS "cards_write_policy" ON cards;

-- Создаем новую политику, которая позволяет аутентифицированным пользователям обновлять карточки
CREATE POLICY "cards_update_policy" ON cards 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Также создаем политику для вставки новых карточек
CREATE POLICY "cards_insert_policy" ON cards 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Проверяем, что политики созданы
DO $$
DECLARE
  policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename = 'cards';
  
  RAISE NOTICE '=== CARDS UPDATE POLICY FIX ===';
  RAISE NOTICE 'Number of policies for cards table: %', policies_count;
  
  IF policies_count >= 3 THEN
    RAISE NOTICE '✅ Cards update policies configured successfully!';
  ELSE
    RAISE NOTICE '⚠️ Some policies may not have been created properly';
  END IF;
END $$;



