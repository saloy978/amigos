# 🖼️ Настройка генерации изображений для карточек

## 📋 Обзор

Система генерации изображений для карточек слов работает в двух режимах:

1. **Умная генерация по категориям** (текущий режим) - автоматически подбирает изображения на основе категории слова
2. **API генерация** (опционально) - использует внешние API для получения релевантных изображений

## 🎯 Текущая реализация

### Умная генерация по категориям

Система автоматически определяет категорию слова и подбирает подходящее изображение:

- **Животные** - изображения животных
- **Еда** - изображения еды и напитков  
- **Природа** - изображения природы, погоды, ландшафтов
- **Люди** - изображения людей и профессий
- **Цвета** - изображения с соответствующими цветами
- **Числа** - абстрактные изображения для чисел
- **Время** - изображения, связанные со временем
- **Предметы** - изображения предметов и объектов
- **По умолчанию** - универсальные изображения

### Алгоритм работы

1. **Анализ слова**: Система анализирует как изучаемое слово, так и его перевод
2. **Определение категории**: Сопоставляет слова с ключевыми словами категорий
3. **Выбор изображения**: Использует хеш-функцию для консистентного выбора изображения
4. **Fallback**: Если категория не определена, использует изображения по умолчанию

## 🔧 Настройка API генерации (опционально)

### Unsplash API

1. Зарегистрируйтесь на [unsplash.com/developers](https://unsplash.com/developers)
2. Создайте новое приложение
3. Скопируйте Access Key
4. Замените `YOUR_UNSPLASH_ACCESS_KEY` в `src/services/imageGenerator.ts`

### Pexels API

1. Зарегистрируйтесь на [pexels.com/api](https://www.pexels.com/api/)
2. Получите API ключ
3. Замените `YOUR_PEXELS_API_KEY` в `src/services/imageGenerator.ts`

### Переключение на API режим

Чтобы использовать API вместо умной генерации:

1. Откройте `src/services/aiWordGenerator.ts`
2. Замените импорт:
   ```typescript
   // Было
   import { SimpleImageGeneratorService } from './simpleImageGenerator';
   
   // Стало
   import { ImageGeneratorService } from './imageGenerator';
   ```
3. Обновите вызов в методе `formatSelectedWords`:
   ```typescript
   // Было
   const wordsWithImages = SimpleImageGeneratorService.generateImagesForWords(...)
   
   // Стало
   const wordsWithImages = await ImageGeneratorService.generateImagesForWords(...)
   ```

## 📁 Структура файлов

```
src/services/
├── imageGenerator.ts          # API генерация (Unsplash/Pexels)
├── simpleImageGenerator.ts    # Умная генерация по категориям
└── aiWordGenerator.ts         # Основной сервис генерации слов

src/components/modals/
├── ImageApiSetupModal.tsx     # Модальное окно настройки API
└── AIWordGeneratorModal.tsx   # Модальное окно генерации слов
```

## 🎨 Категории изображений

### Животные
- Собака, кот, птица, рыба, лошадь, корова, свинья, овца, кролик, мышь
- Lion, tiger, bear, elephant, monkey, snake, frog, spider, bee, butterfly

### Еда
- Яблоко, банан, апельсин, хлеб, молоко, кофе, чай, вода, сок, торт
- Pizza, chicken, rice, pasta, meat, fish, vegetable, fruit, soup, salad

### Природа
- Солнце, луна, звезда, облако, дождь, снег, ветер, дерево, цветок, трава
- Mountain, river, sea, beach, forest, sky, earth, fire, water, stone

### Люди
- Мама, папа, сестра, брат, бабушка, дедушка, малыш, ребёнок
- Teacher, doctor, nurse, police, cook, driver, farmer, artist

### Цвета
- Красный, синий, зелёный, жёлтый, чёрный, белый, коричневый
- Red, blue, green, yellow, black, white, brown, pink, purple, orange

### Числа
- Один, два, три, четыре, пять, шесть, семь, восемь, девять, десять
- One, two, three, four, five, six, seven, eight, nine, ten

### Время
- Утро, день, вечер, ночь, сегодня, завтра, вчера
- Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

### Предметы
- Дом, комната, стол, стул, кровать, машина, книга, телефон
- House, room, table, chair, bed, car, book, phone, computer

## 🔄 Консистентность изображений

Система использует хеш-функцию для обеспечения консистентности:
- Одно и то же слово всегда получает одно и то же изображение
- Изображение выбирается на основе хеша от слова и перевода
- Это обеспечивает предсказуемость для пользователей

## 🚀 Расширение системы

### Добавление новых категорий

1. Добавьте новую категорию в `FALLBACK_IMAGES`:
   ```typescript
   newCategory: [
     'https://example.com/image1.jpg',
     'https://example.com/image2.jpg'
   ]
   ```

2. Обновите метод `categorizeWord`:
   ```typescript
   if (this.matchesCategory(word, ['keyword1', 'keyword2'])) {
     return 'newCategory';
   }
   ```

### Добавление новых языков

1. Добавьте ключевые слова на новом языке в соответствующие категории
2. Обновите метод `buildSearchQuery` в `imageGenerator.ts` для поддержки нового языка

## 🐛 Отладка

### Проверка категоризации

Добавьте логирование в `SimpleImageGeneratorService.categorizeWord()`:
```typescript
console.log('Word:', word, 'Category:', category);
```

### Проверка выбора изображения

Добавьте логирование в `SimpleImageGeneratorService.generateImage()`:
```typescript
console.log('Hash:', hash, 'Image index:', imageIndex, 'URL:', imageUrl);
```

## 📊 Производительность

- **Умная генерация**: Мгновенная, без внешних запросов
- **API генерация**: 500-2000ms на запрос, зависит от API
- **Fallback**: Мгновенная, использует предзагруженные изображения

## 🔒 Безопасность

- API ключи должны храниться в переменных окружения
- Не коммитьте API ключи в репозиторий
- Используйте HTTPS для всех внешних запросов
- Ограничьте количество запросов к API

## 📝 Примеры использования

### Генерация изображения для одного слова
```typescript
const result = SimpleImageGeneratorService.generateImage({
  term: 'apple',
  translation: 'яблоко',
  language: 'en'
});
console.log(result.imageUrl); // URL изображения яблока
```

### Генерация изображений для массива слов
```typescript
const words = [
  { term: 'dog', translation: 'собака', language: 'en' },
  { term: 'cat', translation: 'кот', language: 'en' }
];
const results = SimpleImageGeneratorService.generateImagesForWords(words);
```

## 🎯 Рекомендации

1. **Для разработки**: Используйте умную генерацию по категориям
2. **Для продакшена**: Настройте API ключи для лучшего качества
3. **Для оффлайн режима**: Умная генерация работает без интернета
4. **Для кастомизации**: Легко добавляйте новые категории и изображения

