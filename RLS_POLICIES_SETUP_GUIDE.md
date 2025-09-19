# Настройка RLS политик для Storage

## 🔐 **Проблема с правами доступа**

Таблица `storage.objects` является системной и требует специальных прав для изменения RLS политик. Миграция не может быть применена автоматически.

## 🛠️ **Ручная настройка через Supabase Dashboard**

### **Шаг 1: Откройте Supabase Dashboard**

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard/project/nwtyjslkvwuxdfhlucgv)
2. Выберите ваш проект
3. Перейдите в раздел **Authentication** → **Policies**

### **Шаг 2: Найдите таблицу storage.objects**

1. В списке таблиц найдите `storage.objects`
2. Если RLS не включен, включите его кнопкой **"Enable RLS"**

### **Шаг 3: Создайте политики**

Нажмите **"New Policy"** и создайте следующие политики:

#### **Политика 1: read_public_cards**
```sql
-- Название: read_public_cards
-- Операция: SELECT
-- Роли: authenticated, anon

(bucket_id = 'cards')
```

#### **Политика 2: read_public_user_images**
```sql
-- Название: read_public_user_images
-- Операция: SELECT
-- Роли: authenticated, anon

(bucket_id = 'user-images')
```

#### **Политика 3: insert_own_files**
```sql
-- Название: insert_own_files
-- Операция: INSERT
-- Роли: authenticated

(bucket_id = 'user-images' AND owner = auth.uid())
```

#### **Политика 4: update_own_files**
```sql
-- Название: update_own_files
-- Операция: UPDATE
-- Роли: authenticated

(bucket_id = 'user-images' AND owner = auth.uid())
```

#### **Политика 5: delete_own_files**
```sql
-- Название: delete_own_files
-- Операция: DELETE
-- Роли: authenticated

(bucket_id = 'user-images' AND owner = auth.uid())
```

## 🔧 **Альтернативный способ через SQL Editor**

### **Шаг 1: Откройте SQL Editor**

1. Перейдите в **SQL Editor**
2. Создайте новый запрос

### **Шаг 2: Выполните SQL код**

```sql
-- Включить RLS на storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Удалить существующие политики (если есть)
DROP POLICY IF EXISTS "read_public_cards" ON storage.objects;
DROP POLICY IF EXISTS "read_public_user_images" ON storage.objects;
DROP POLICY IF EXISTS "read_own_files" ON storage.objects;
DROP POLICY IF EXISTS "insert_own_files" ON storage.objects;
DROP POLICY IF EXISTS "update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "delete_own_files" ON storage.objects;

-- Создать политики для публичного доступа к cards
CREATE POLICY "read_public_cards"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'cards');

-- Создать политики для публичного доступа к user-images
CREATE POLICY "read_public_user_images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'user-images');

-- Создать политики для операций записи/обновления/удаления
CREATE POLICY "insert_own_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

CREATE POLICY "update_own_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

CREATE POLICY "delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid());

-- Предоставить разрешения
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;
```

### **Шаг 3: Проверьте результат**

Выполните проверочный запрос:

```sql
-- Проверка политик
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
```

## ✅ **Ожидаемый результат**

После настройки у вас должно быть **5 политик**:

1. **read_public_cards** - чтение из бакета `cards` (все пользователи)
2. **read_public_user_images** - чтение из бакета `user-images` (все пользователи)
3. **insert_own_files** - загрузка в бакет `user-images` (только владелец)
4. **update_own_files** - обновление в бакете `user-images` (только владелец)
5. **delete_own_files** - удаление из бакета `user-images` (только владелец)

## 🔍 **Проверка работы**

### **Тест 1: Публичный доступ**
```sql
-- Должно работать для всех пользователей
SELECT * FROM storage.objects WHERE bucket_id = 'cards' LIMIT 1;
SELECT * FROM storage.objects WHERE bucket_id = 'user-images' LIMIT 1;
```

### **Тест 2: Загрузка файла**
```javascript
// В вашем приложении
const { data, error } = await supabase.storage
  .from('user-images')
  .upload('test/test.webp', file);

if (error) {
  console.error('Upload failed:', error);
} else {
  console.log('Upload successful:', data);
}
```

## 🚨 **Важные замечания**

1. **Публичный доступ**: Все изображения в обоих бакетах будут доступны всем пользователям
2. **Безопасность**: Только авторизованные пользователи могут загружать/изменять файлы
3. **Владелец**: Пользователь может изменять только свои файлы
4. **RLS**: Политики работают на уровне базы данных, обеспечивая безопасность

## 🎯 **Готово!**

После настройки RLS политик ваша система хранения изображений будет полностью функциональна:

- ✅ Публичный доступ к изображениям
- ✅ Безопасная загрузка файлов
- ✅ Контроль доступа на уровне пользователя
- ✅ Интеграция с Leonardo.AI
- ✅ Автоматическое сохранение в Storage

Система готова к использованию! 🎉






