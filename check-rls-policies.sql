-- Проверка RLS политик
-- Выполните этот запрос в Supabase Dashboard → SQL Editor

-- 1. Проверяем RLS для user_settings
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_settings', 'user_streak', 'user_cards', 'cards');

-- 2. Проверяем политики для user_settings
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
  AND tablename = 'user_settings';

-- 3. Проверяем политики для user_streak
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
  AND tablename = 'user_streak';

-- 4. Проверяем политики для user_cards
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
  AND tablename = 'user_cards';


















