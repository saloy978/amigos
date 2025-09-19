# 📚 Система слов для уроков

Эта папка содержит слова и фразы для каждого урока, которые можно добавить в коллекцию пользователя через кнопку "Добавить слова из урока".

## 📁 Структура файлов

```
src/context/lessons/words/
├── index.ts              # Главный файл экспорта
├── intro-words.ts        # Слова для урока "Приветствие и знакомство"
├── lesson1-words.ts      # Слова для урока "Род существительных"
└── README.md            # Эта документация
```

## 🔧 Как добавить новый урок

1. **Создайте файл слов** для нового урока:
   ```typescript
   // src/context/lessons/words/lesson2-words.ts
   export const lesson2Words = [
     { term: 'palabra', translation: 'слово', english: 'word' },
     { term: 'frase', translation: 'фраза', english: 'phrase' },
     // ... другие слова
   ];
   ```

2. **Добавьте экспорт** в `index.ts`:
   ```typescript
   export { lesson2Words } from './lesson2-words';
   ```

3. **Обновите функцию `getLessonWords`** в `index.ts`:
   ```typescript
   case 'lesson-2':
     return require('./lesson2-words').lesson2Words;
   ```

4. **Добавьте ID урока** в `getAvailableLessonsWithWords()`:
   ```typescript
   return ['intro', 'lesson-1', 'lesson1', 'lesson-2'];
   ```

## 📝 Формат слова

Каждое слово должно иметь следующую структуру:

```typescript
interface LessonWord {
  term: string;        // Слово на изучаемом языке (испанский)
  translation: string; // Перевод на родной язык (русский)
  english?: string;    // Перевод на английский (опционально)
}
```

## 🎯 Использование в компонентах

Функция `extractWordsFromLesson()` в компонентах уроков автоматически загружает слова из соответствующих файлов:

```typescript
// В LessonScreen.tsx и Lesson1Screen.tsx
const extractWordsFromLesson = () => {
  const words = [];
  
  if (lessonId) {
    try {
      const lessonWords = require(`../../context/lessons/words/index`).getLessonWords(lessonId);
      words.push(...lessonWords);
    } catch (error) {
      // Fallback к старому методу
    }
  }
  
  return words;
};
```

## ✅ Преимущества новой системы

- **Организованность**: Каждый урок имеет свой файл со словами
- **Масштабируемость**: Легко добавлять новые уроки
- **Централизация**: Все слова в одном месте
- **Типизация**: TypeScript интерфейсы для безопасности
- **Fallback**: Старая система как резервный вариант

## 🔄 Миграция

Старая система извлечения слов из `practice.items` и `dialogues` сохранена как fallback на случай ошибок загрузки новых файлов.


















