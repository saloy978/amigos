# Руководство по миграции базы данных

## Обзор изменений

Структура базы данных была исправлена для правильного использования `auth.users` вместо кастомной таблицы `users`. Теперь все данные пользователей хранятся в таблице `user_settings`, которая связана с `auth.users`.

## Что изменилось

### 1. Удалена таблица `users`
- Таблица `users` больше не используется
- Все данные из `users` перенесены в `user_settings`

### 2. Обновлена таблица `user_settings`
- Добавлены поля: `name`, `avatar_url`, `level`
- Теперь `user_id` ссылается на `auth.users(id)` вместо `users(id)`
- Таблица содержит как настройки, так и профиль пользователя

### 3. Обновлены политики безопасности (RLS)
- Все политики теперь используют `auth.uid()` для идентификации пользователя
- Политики работают с `user_settings` вместо `users`

## Как применить миграцию

### 1. Применить миграцию в Supabase

```bash
# Если используете Supabase CLI
supabase db push

# Или примените миграцию вручную в Supabase Dashboard
# Скопируйте содержимое файла: supabase/migrations/20250109000000_fix_user_structure.sql
```

### 2. Проверить структуру базы данных

После применения миграции убедитесь, что:

1. Таблица `users` удалена
2. Таблица `user_settings` содержит новые поля: `name`, `avatar_url`, `level`
3. Политики RLS обновлены
4. Данные пользователей перенесены корректно

### 3. Обновить код (уже сделано)

Код уже обновлен для работы с новой структурой:
- `UserService` теперь работает с `user_settings` вместо `users`
- Все методы обновлены для работы с `auth.users`

## Структура таблицы user_settings

```sql
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'User',
  avatar_url text DEFAULT '/assets/Foto.png',
  level text DEFAULT 'Beginner',
  known_language text DEFAULT 'Русский',
  learning_language text DEFAULT 'Español',
  known_language_code text DEFAULT 'ru',
  learning_language_code text DEFAULT 'es',
  daily_goal integer DEFAULT 20,
  notifications_enabled boolean DEFAULT true,
  sound_effects_enabled boolean DEFAULT true,
  app_language text DEFAULT 'ru',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Политики безопасности

```sql
-- Пользователи могут читать только свои настройки
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Пользователи могут обновлять только свои настройки
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Пользователи могут создавать только свои настройки
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

## Проверка после миграции

1. Убедитесь, что приложение запускается без ошибок
2. Проверьте, что пользователи могут входить в систему
3. Убедитесь, что настройки пользователей сохраняются корректно
4. Проверьте, что карточки пользователей загружаются правильно

## Откат изменений (если необходимо)

Если нужно откатить изменения:

1. Восстановите таблицу `users` из бэкапа
2. Восстановите старые политики RLS
3. Откатите изменения в коде
4. Удалите новые поля из `user_settings`

## Поддержка

Если возникли проблемы с миграцией, проверьте:
- Логи Supabase на наличие ошибок
- Правильность применения миграции
- Соответствие кода новой структуре базы данных























