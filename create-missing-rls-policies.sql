-- Создание недостающих RLS политик
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Включаем RLS для user_settings если не включен
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 2. Создаем политику для user_settings
CREATE POLICY user_settings_owner_policy ON user_settings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Включаем RLS для user_streak если не включен
ALTER TABLE user_streak ENABLE ROW LEVEL SECURITY;

-- 4. Создаем политику для user_streak
CREATE POLICY user_streak_owner_policy ON user_streak
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Включаем RLS для cards если не включен
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 6. Создаем политику для cards (только чтение для всех)
CREATE POLICY cards_read_policy ON cards
  FOR SELECT USING (true);

-- 7. Создаем политику для cards (вставка только для аутентифицированных)
CREATE POLICY cards_insert_policy ON cards
  FOR INSERT WITH CHECK (true);

-- 8. Проверяем созданные политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_settings', 'user_streak', 'cards', 'user_cards')
ORDER BY tablename, policyname;


















