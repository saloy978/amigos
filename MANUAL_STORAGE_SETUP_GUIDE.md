# Ручная настройка Storage в Supabase Dashboard

Поскольку автоматическое применение миграции требует пароль базы данных, выполните следующие шаги вручную через Supabase Dashboard:

## 🔧 Шаг 1: Откройте SQL Editor

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor**
4. Создайте новый запрос

## 📝 Шаг 2: Выполните SQL код

Скопируйте и выполните следующий SQL код:

```sql
-- Step 1: Add english field to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS english TEXT;
COMMENT ON COLUMN cards.english IS 'English translation of the word, used for image generation and three-language support';

-- Step 2: Add image storage fields
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_metadata JSONB;
ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS custom_image_path TEXT;
ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS custom_image_metadata JSONB;

-- Step 3: Add comments
COMMENT ON COLUMN cards.image_path IS 'Path to image in storage.buckets.cards (public)';
COMMENT ON COLUMN cards.image_metadata IS 'Metadata about the image (source, prompt, etc.)';
COMMENT ON COLUMN user_cards.custom_image_path IS 'Path to user-specific image in storage.buckets.user-images (private)';
COMMENT ON COLUMN user_cards.custom_image_metadata IS 'Metadata about the user-specific image';

-- Step 4: Update existing data
UPDATE cards 
SET english = translation 
WHERE language_pair_id LIKE '%en%' 
  AND english IS NULL;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_english ON cards(english);
CREATE INDEX IF NOT EXISTS idx_cards_image_path ON cards(image_path);
CREATE INDEX IF NOT EXISTS idx_user_cards_custom_image_path ON user_cards(custom_image_path);

-- Step 6: Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_english_not_empty'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT check_english_not_empty 
      CHECK (english IS NULL OR length(trim(english)) > 0);
  END IF;
END $$;
```

## 🗂️ Шаг 3: Создайте Storage Buckets

1. Перейдите в раздел **Storage**
2. Создайте два бакета:

### Бакет 1: `cards` (Публичный)
- **Name**: `cards`
- **Public**: ✅ Да
- **File size limit**: 5MB
- **Allowed MIME types**: `image/webp,image/jpeg,image/png`

### Бакет 2: `user-images` (Публичный)
- **Name**: `user-images`
- **Public**: ✅ Да
- **File size limit**: 10MB
- **Allowed MIME types**: `image/webp,image/jpeg,image/png`

## 🔐 Шаг 4: Настройте RLS политики

В разделе **Storage** → **Policies** создайте следующие политики:

### Для бакета `cards` (публичный):
```sql
-- Политика чтения для всех
CREATE POLICY "read_public_cards"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'cards');
```

### Для бакета `user-images` (публичный):
```sql
-- Политика чтения для всех
CREATE POLICY "read_public_user_images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'user-images');

-- Запись: только владелец
CREATE POLICY "insert_own_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

-- Обновление: только владелец
CREATE POLICY "update_own_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

-- Удаление: только владелец
CREATE POLICY "delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid());
```

## 🔧 Шаг 5: Создайте функции базы данных

Выполните следующий SQL код:

```sql
-- Helper functions
CREATE OR REPLACE FUNCTION get_public_image_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN CONCAT('https://your-project.supabase.co/storage/v1/object/public/cards/', image_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_signed_image_url(
  image_path TEXT,
  expires_in_seconds INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN CONCAT('signed://', image_path, '?expires=', expires_in_seconds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main functions
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT id INTO card_id
  FROM cards
  WHERE language_pair_id = p_language_pair_id
    AND term = p_term
    AND translation = p_translation;
  
  IF card_id IS NULL THEN
    INSERT INTO cards (language_pair_id, term, translation, image_url, english)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url, p_english)
    RETURNING id INTO card_id;
  ELSE
    IF p_english IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM cards WHERE id = card_id AND english IS NOT NULL
    ) THEN
      UPDATE cards SET english = p_english WHERE id = card_id;
    END IF;
  END IF;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_english TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url, p_english) INTO card_id;
  
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 👁️ Шаг 6: Обновите представления

```sql
-- Drop and recreate views
DROP VIEW IF EXISTS user_cards_with_content CASCADE;
CREATE VIEW user_cards_with_content AS
SELECT 
  uc.user_id,
  uc.card_id,
  uc.state,
  uc.progress,
  uc.review_count,
  uc.successful_reviews,
  uc.direction,
  uc.ease_factor,
  uc.interval_days,
  uc.due_at,
  uc.last_reviewed_at,
  uc.created_at,
  uc.updated_at,
  uc.custom_image_path,
  uc.custom_image_metadata,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url,
  c.image_path,
  c.image_metadata,
  c.english
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

DROP VIEW IF EXISTS cards_due_for_review CASCADE;
CREATE VIEW cards_due_for_review AS
SELECT 
  uc.*,
  c.term,
  c.translation,
  c.image_url,
  c.image_path,
  c.image_metadata,
  c.english
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.due_at <= now()
  AND uc.state = 'REVIEW';
```

## 🔑 Шаг 7: Предоставьте разрешения

```sql
-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_card(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_image_url(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_signed_image_url(text, integer) TO authenticated;
```

## ✅ Шаг 8: Проверка

Выполните проверочный запрос:

```sql
-- Verification query
SELECT 
  EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'cards') as cards_bucket_exists,
  EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'user-images') as user_images_bucket_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'english') as english_column_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'image_path') as image_path_column_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cards' AND column_name = 'custom_image_path') as custom_image_path_column_exists;
```

Все значения должны быть `true`.

## 🎉 Готово!

После выполнения всех шагов:

1. ✅ База данных обновлена с новыми полями
2. ✅ Storage бакеты созданы
3. ✅ RLS политики настроены
4. ✅ Функции созданы
5. ✅ Представления обновлены
6. ✅ Разрешения предоставлены

Теперь вы можете использовать систему хранения изображений в вашем приложении!

## 🔗 Полезные ссылки

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-from-upload)
