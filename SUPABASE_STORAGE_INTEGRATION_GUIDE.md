# Интеграция Supabase Storage для карточек

## Обзор системы

Реализована полная система хранения изображений в Supabase Storage с поддержкой:
- Публичных изображений (общие для всех пользователей)
- Приватных пользовательских изображений
- Интеграции с Leonardo.AI
- Автоматического преобразования в WebP
- Трансформаций изображений на лету
- Безопасного доступа через RLS

## 🗂️ Структура Storage

### Бакеты:
- **`cards`** (Public) - общие изображения для всех пользователей
- **`user-images`** (Private) - приватные пользовательские изображения

### Структура путей:
```
cards/{card_id}/orig.webp
user-images/{user_id}/cards/{card_id}/orig.webp
```

## 🗄️ Обновления базы данных

### Новые поля в таблице `cards`:
- `image_path` (TEXT) - путь к изображению в Storage
- `image_metadata` (JSONB) - метаданные изображения

### Новые поля в таблице `user_cards`:
- `custom_image_path` (TEXT) - путь к пользовательскому изображению
- `custom_image_metadata` (JSONB) - метаданные пользовательского изображения

## 🔐 Безопасность (RLS)

### Публичный бакет `cards`:
- Чтение доступно всем (authenticated + anon)
- Запись только через service_role

### Приватный бакет `user-images`:
- Доступ только владельцу файла
- Автоматическая проверка через `auth.uid()`

## 📁 Файлы системы

### 1. Миграция базы данных
**`supabase/migrations/20250113000007_setup_image_storage.sql`**
- Создание бакетов
- Настройка RLS политик
- Добавление полей в таблицы
- Создание helper функций
- Триггеры для автоматической очистки

### 2. Сервис работы с изображениями
**`src/services/imageStorageService.ts`**
```typescript
// Основные методы:
- uploadPublicCardImage()     // Загрузка в публичный бакет
- uploadUserCardImage()       // Загрузка в приватный бакет
- importImageFromUrl()        // Импорт из URL (Leonardo.AI)
- getPublicImageUrl()         // Получение публичного URL
- createSignedUrl()           // Создание подписанной ссылки
- getImageUrlWithTransform()  // URL с трансформациями
- deleteImage()               // Удаление изображения
- convertToWebP()             // Конвертация в WebP
```

### 3. Обновленный CardService
**`src/services/cardService.ts`**
```typescript
// Новые методы:
- uploadCardImage()           // Загрузка изображения для карточки
- uploadUserCardImage()       // Загрузка пользовательского изображения
- importCardImageFromUrl()    // Импорт из URL
- deleteUserCardImage()       // Удаление пользовательского изображения
- getCardImageUrl()           // Получение URL изображения (приоритет: custom > public)
- getCardThumbnailUrl()       // Получение URL миниатюры
```

### 4. Компонент загрузки
**`src/components/modals/ImageUploadModal.tsx`**
- Drag & drop загрузка
- Предварительный просмотр
- Валидация файлов
- Конвертация в WebP
- Прогресс загрузки

### 5. Интеграция Leonardo.AI
**`src/services/leonardoImageGenerator.ts`**
```typescript
// Новые методы:
- generateAndSaveImage()      // Генерация + сохранение в Storage
- generateForCard()           // Генерация для конкретной карточки
- generateMultipleVariants()  // Несколько вариантов стилей
- createImagePrompt()         // Создание промпта на основе слова
```

## 🚀 Использование

### Применение миграции:
```bash
# Автоматически (рекомендуется)
.\supabase.exe db push

# Или вручную через SQL Editor в Supabase Dashboard
```

### Загрузка изображения пользователем:
```typescript
import { ImageUploadModal } from './components/modals/ImageUploadModal';

<ImageUploadModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  card={selectedCard}
  onImageUploaded={(imageUrl) => {
    // Обновить UI с новым изображением
    setCardImageUrl(imageUrl);
  }}
/>
```

### Генерация изображения через Leonardo.AI:
```typescript
import { LeonardoImageGeneratorService } from './services/leonardoImageGenerator';

const result = await LeonardoImageGeneratorService.generateForCard(
  cardId,
  term,
  translation,
  english,
  'cartoon'
);

if (result.success) {
  console.log('Изображение сгенерировано:', result.imageUrl);
}
```

### Получение URL изображения:
```typescript
import { CardService } from './services/cardService';

// Получить URL изображения (приоритет: custom > public)
const imageUrl = await CardService.getCardImageUrl(card);

// Получить URL миниатюры
const thumbnailUrl = await CardService.getCardThumbnailUrl(card, 200);
```

## 🎨 Трансформации изображений

### Публичные изображения:
```typescript
// Базовый URL
const url = ImageStorageService.getPublicImageUrl('cards/123/orig.webp');

// С трансформациями
const thumbnailUrl = ImageStorageService.getImageUrlWithTransform(
  'cards/123/orig.webp',
  {
    width: 200,
    height: 200,
    resize: 'cover',
    quality: 80,
    format: 'webp'
  },
  true // isPublic
);
```

### Приватные изображения:
```typescript
// Создание подписанной ссылки с трансформациями
const signedUrl = await ImageStorageService.createSignedUrl(
  'user-images/user123/cards/456/orig.webp',
  3600 // expires in 1 hour
);
```

## 📊 Метаданные изображений

### Структура метаданных:
```typescript
interface ImageMetadata {
  source?: 'leonardo' | 'user_upload' | 'ai_generated' | 'manual';
  prompt?: string;
  model?: string;
  seed?: string;
  negative_prompt?: string;
  license?: string;
  generated_at?: string;
  original_url?: string;
  style?: string;
  language?: string;
  [key: string]: any;
}
```

### Пример метаданных для Leonardo.AI:
```typescript
const metadata: ImageMetadata = {
  source: 'leonardo',
  prompt: 'A clear, simple illustration of "casa" (дом)',
  model: 'FLUX',
  seed: '12345',
  generated_at: '2025-01-13T10:30:00Z',
  original_url: 'https://leonardo.ai/generated/...',
  style: 'cartoon',
  language: 'es'
};
```

## 🔧 Настройка в Supabase

### 1. Создание бакетов:
```sql
-- Выполняется автоматически миграцией
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cards', 'cards', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png']),
  ('user-images', 'user-images', false, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']);
```

### 2. Настройка RLS:
```sql
-- Публичный доступ к cards
CREATE POLICY "read_public_cards"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'cards');

-- Приватный доступ к user-images
CREATE POLICY "read_own_files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid());
```

## 🧪 Тестирование

### 1. Проверка загрузки:
```typescript
// Тест загрузки изображения
const file = new File(['test'], 'test.webp', { type: 'image/webp' });
const result = await ImageStorageService.uploadPublicCardImage(file, 123);
console.log('Upload result:', result);
```

### 2. Проверка генерации:
```typescript
// Тест генерации через Leonardo.AI
const result = await LeonardoImageGeneratorService.generateForCard(
  123, 'casa', 'дом', 'house', 'cartoon'
);
console.log('Generation result:', result);
```

### 3. Проверка URL:
```typescript
// Тест получения URL
const url = await CardService.getCardImageUrl(card);
console.log('Image URL:', url);
```

## 📈 Оптимизации

### 1. Кэширование:
- Supabase автоматически кэширует через CDN
- Подписанные ссылки кэшируются на 1 час
- Используйте версионирование для инвалидации

### 2. Сжатие:
- Автоматическая конвертация в WebP
- Параметр `quality` для баланса размера/качества
- Трансформации на лету для миниатюр

### 3. Безопасность:
- RLS политики для контроля доступа
- Автоматическая очистка при удалении карточек
- Валидация типов и размеров файлов

## 🚨 Важные замечания

1. **Применение миграции**: Обязательно примените миграцию перед использованием
2. **API ключи**: Настройте Leonardo.AI API ключ для генерации
3. **Размеры файлов**: Лимиты 5MB для публичных, 10MB для приватных
4. **Форматы**: Рекомендуется WebP для лучшего сжатия
5. **Безопасность**: Приватные изображения доступны только владельцу

## 🔄 Миграция существующих данных

Если у вас есть существующие изображения в поле `imageUrl`:
```typescript
// Миграция существующих изображений
const cards = await CardService.getUserCards();
for (const card of cards) {
  if (card.imageUrl && !card.imagePath) {
    // Импортировать в Storage
    await CardService.importCardImageFromUrl(
      card.cardId,
      card.imageUrl,
      true, // public
      { source: 'migration' }
    );
  }
}
```

Система готова к использованию! 🎉






