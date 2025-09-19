-- Создание только недостающих RLS политик
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем и создаем политику для user_streak (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_streak' 
    AND policyname = 'user_streak_owner_policy'
  ) THEN
    ALTER TABLE user_streak ENABLE ROW LEVEL SECURITY;
    CREATE POLICY user_streak_owner_policy ON user_streak
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    RAISE NOTICE 'Created user_streak_owner_policy';
  ELSE
    RAISE NOTICE 'user_streak_owner_policy already exists';
  END IF;
END $$;

-- 2. Проверяем и создаем политики для cards (если не существуют)
DO $$
BEGIN
  -- Политика для чтения
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cards' 
    AND policyname = 'cards_read_policy'
  ) THEN
    ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
    CREATE POLICY cards_read_policy ON cards
      FOR SELECT USING (true);
    RAISE NOTICE 'Created cards_read_policy';
  ELSE
    RAISE NOTICE 'cards_read_policy already exists';
  END IF;

  -- Политика для вставки
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cards' 
    AND policyname = 'cards_insert_policy'
  ) THEN
    CREATE POLICY cards_insert_policy ON cards
      FOR INSERT WITH CHECK (true);
    RAISE NOTICE 'Created cards_insert_policy';
  ELSE
    RAISE NOTICE 'cards_insert_policy already exists';
  END IF;
END $$;

-- 3. Проверяем финальное состояние политик
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_settings', 'user_streak', 'cards', 'user_cards')
ORDER BY tablename, policyname;


















