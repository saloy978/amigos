# Инструкции по ручному применению миграции

Поскольку Supabase CLI требует аутентификации через браузер, вот инструкции для ручного применения миграции через Supabase Dashboard.

## Шаги для применения миграции:

### 1. Откройте Supabase Dashboard
- Перейдите на https://supabase.com/dashboard
- Войдите в свой аккаунт
- Выберите проект: `nwtyjslkvwuxdfhlucgv`

### 2. Откройте SQL Editor
- В левом меню нажмите на "SQL Editor"
- Нажмите "New query"

### 3. Примените миграцию
Скопируйте и выполните следующий SQL код:

```sql
/*
  # Fix user structure to use auth.users instead of custom users table

  1. Migration Steps
    - Add user profile fields to user_settings table (name, avatar_url, level)
    - Migrate data from users table to user_settings
    - Update user_settings to reference auth.users instead of users
    - Drop the custom users table
    - Update policies and indexes

  2. New user_settings structure
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `name` (text, user's display name)
    - `avatar_url` (text, optional avatar URL)
    - `level` (text, user's learning level)
    - `known_language` (text)
    - `learning_language` (text)
    - `known_language_code` (text)
    - `learning_language_code` (text)
    - `daily_goal` (integer, default 20)
    - `notifications_enabled` (boolean, default true)
    - `sound_effects_enabled` (boolean, default true)
    - `app_language` (text, default 'ru')
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. Security
    - Update RLS policies to work with auth.users
    - Ensure all policies use auth.uid() for user identification
*/

-- Step 1: Add user profile fields to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS name text DEFAULT 'User',
ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '/assets/Foto.png',
ADD COLUMN IF NOT EXISTS level text DEFAULT 'Beginner';

-- Step 2: Migrate data from users table to user_settings
-- Update existing user_settings with data from users table
UPDATE user_settings 
SET 
  name = COALESCE(users.name, user_settings.name),
  avatar_url = COALESCE(users.avatar_url, user_settings.avatar_url),
  level = COALESCE(users.level, user_settings.level)
FROM users 
WHERE user_settings.user_id = users.id;

-- Step 3: Create user_settings for users who don't have settings yet
INSERT INTO user_settings (
  user_id,
  name,
  avatar_url,
  level,
  known_language,
  learning_language,
  known_language_code,
  learning_language_code,
  daily_goal,
  notifications_enabled,
  sound_effects_enabled,
  app_language,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.name,
  u.avatar_url,
  u.level,
  'Русский',
  'Español',
  'ru',
  'es',
  20,
  true,
  true,
  'ru',
  u.created_at,
  u.updated_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings us WHERE us.user_id = u.id
);

-- Step 4: Update foreign key constraint to reference auth.users
-- First, drop the existing foreign key constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Update RLS policies for user_settings
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Create new policies that work with auth.users
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 6: Update indexes
-- Drop old index
DROP INDEX IF EXISTS idx_user_settings_user_id;

-- Create new index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Step 7: Drop the custom users table and its policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Drop the users table
DROP TABLE IF EXISTS users CASCADE;

-- Step 8: Add constraints to ensure data integrity
ALTER TABLE user_settings 
ADD CONSTRAINT check_name_not_empty 
  CHECK (name IS NOT NULL AND length(trim(name)) > 0);

ALTER TABLE user_settings 
ADD CONSTRAINT check_level_valid 
  CHECK (level IN ('Beginner', 'Intermediate', 'Advanced'));

-- Step 9: Add comments to document the new structure
COMMENT ON TABLE user_settings IS 'User settings and profile information linked to auth.users';
COMMENT ON COLUMN user_settings.user_id IS 'References auth.users.id for authentication';
COMMENT ON COLUMN user_settings.name IS 'User display name';
COMMENT ON COLUMN user_settings.avatar_url IS 'User avatar image URL';
COMMENT ON COLUMN user_settings.level IS 'User learning level: Beginner, Intermediate, Advanced';
```

### 4. Проверьте результат
После выполнения миграции проверьте:

1. **Таблица `users` удалена** - в разделе "Table Editor" не должно быть таблицы `users`
2. **Таблица `user_settings` обновлена** - должна содержать новые поля: `name`, `avatar_url`, `level`
3. **Политики RLS обновлены** - в разделе "Authentication" > "Policies" проверьте политики для `user_settings`
4. **Данные перенесены** - проверьте, что данные пользователей корректно перенесены в `user_settings`

### 5. Тестирование
После применения миграции:
1. Запустите приложение: `npm run dev`
2. Попробуйте войти в систему
3. Проверьте, что настройки пользователя сохраняются
4. Убедитесь, что карточки загружаются корректно

## Если что-то пошло не так:

### Откат изменений:
Если нужно откатить изменения, выполните:

```sql
-- Восстановить таблицу users (если есть бэкап)
-- Восстановить старые политики
-- Удалить новые поля из user_settings
```

### Проверка логов:
- В Supabase Dashboard перейдите в "Logs"
- Проверьте логи на наличие ошибок
- Убедитесь, что все операции выполнены успешно

## Поддержка:
Если возникли проблемы:
1. Проверьте логи в Supabase Dashboard
2. Убедитесь, что все SQL команды выполнены без ошибок
3. Проверьте, что приложение компилируется без ошибок























