-- Проверка существующих RLS политик
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем все политики для наших таблиц
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

-- 2. Проверяем статус RLS для таблиц
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_settings', 'user_streak', 'cards', 'user_cards');


















