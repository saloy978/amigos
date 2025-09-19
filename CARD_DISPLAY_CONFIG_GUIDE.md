# 🎛️ Руководство по настройке отображения карточек

## 📋 Обзор

Система настроек отображения карточек позволяет легко изменять поведение приложения без изменения кода. Все настройки находятся в отдельном файле конфигурации и могут быть изменены через удобный интерфейс.

## 🏗️ Архитектура

### Основные файлы:
- `src/config/cardDisplayConfig.ts` - основная конфигурация
- `src/config/cardDisplayConfigExamples.ts` - примеры предустановок
- `src/context/cards/card_modes.ts` - утилиты для работы с режимами
- `src/hooks/useCardDisplaySettings.ts` - React хук для настроек
- `src/components/modals/CardDisplaySettingsModal.tsx` - интерфейс настроек

## ⚙️ Структура конфигурации

### Режимы отображения (modes)

Каждый режим имеет следующие параметры:

```typescript
interface CardDisplayModeConfig {
  name: string;                    // Название режима
  description: string;             // Описание режима
  minProgress: number;             // Минимальный прогресс (%)
  maxProgress: number;             // Максимальный прогресс (%)
  showTranslationAutomatically: boolean;  // Автопоказ перевода
  translationDelay: number;        // Задержка показа (мс)
  cardReturnDelay: number;         // Задержка возврата к карточке (мс)
  showInputField: boolean;         // Показывать поле ввода
  showActionButtons: boolean;      // Показывать кнопки действий
  requireInputForButtons: boolean; // Требовать ввод для кнопок
  showTranslationOnTap: boolean;   // Показ перевода по тапу
  showWordOnTap: boolean;          // Показ слова по тапу
  nextCardOnEnter: boolean;        // Переход по Enter
  nextCardOnTap: boolean;          // Переход по тапу
  enterPressesToNext: number;      // Количество нажатий Enter
  alternatesWith?: string[];       // Чередование с режимами
  alternateCondition?: 'even' | 'odd'; // Условие чередования
}
```

### Настройки интервальных повторений (spacedRepetition)

```typescript
interface SpacedRepetitionSettings {
  incorrectAnswerDelay: number;    // Задержка после неправильного ответа (мс)
  progressIncrease: number;        // Увеличение прогресса за правильный ответ (%)
  progressDecrease: number;        // Уменьшение прогресса за неправильный ответ (%)
  resetSuccessfulReviewsThreshold: number; // Порог для сброса счетчика (%)
  reviewIntervals: Array<{         // Интервалы повторений
    minutes?: number;              // Минуты
    hours?: number;                // Часы
    days?: number;                 // Дни
  }>;
}
```

### Общие настройки (general)

```typescript
interface GeneralSettings {
  cardAnimation: boolean;          // Анимация карточек
  animationDuration: number;       // Длительность анимации (мс)
  soundEffects: boolean;           // Звуковые эффекты
  visualFeedback: boolean;         // Визуальная обратная связь
  autoSaveProgress: boolean;       // Автосохранение прогресса
  autoSaveInterval: number;        // Интервал автосохранения (мс)
  showProgressIndicator: boolean;  // Показывать индикатор прогресса на карточке
  progressIndicatorSize: number;   // Размер индикатора прогресса (px)
  showProgressPercentage: boolean; // Показывать процент в индикаторе прогресса
}
```

### Настройки сложности (difficulty)

```typescript
interface DifficultySettings {
  beginner: Partial<CardDisplayModeConfig>;    // Для начинающих
  intermediate: Partial<CardDisplayModeConfig>; // Для среднего уровня
  advanced: Partial<CardDisplayModeConfig>;     // Для продвинутых
}
```

## 🎯 Режимы отображения

### 1. DEMONSTRATION (0-19%)
- **Назначение**: Автоматический показ перевода
- **Поведение**: Перевод показывается автоматически через заданное время
- **Использование**: Для новых карточек
- **Состояние**: LEARN (если просрочена) или REVIEW (если не просрочена)

### 2. WORD (20-29%)
- **Назначение**: Показ слова с возможностью увидеть перевод
- **Поведение**: Показывается слово, перевод по тапу на карточку
- **Использование**: Для карточек в процессе изучения
- **Состояние**: LEARN (если просрочена) или REVIEW (если не просрочена)

### 3. TRANSLATION (30-49%)
- **Назначение**: Показ перевода с возможностью увидеть слово
- **Поведение**: Показывается перевод, слово по тапу на карточку
- **Использование**: Для карточек с хорошим прогрессом
- **Состояние**: LEARN (если просрочена) или REVIEW (если не просрочена)

### 4. TRANSLATION_TO_WORD (50-69%)
- **Назначение**: Ввод изучаемого слова при показе перевода
- **Поведение**: Показывается только картинка и перевод, пользователь вводит изучаемое слово
- **Использование**: Для карточек с высоким прогрессом (обратное направление)
- **Состояние**: LEARN (если просрочена) или REVIEW (если не просрочена)


## 📊 Состояния карточек

Система автоматически определяет состояние карточек на основе их прогресса и времени до повторения:

### Логика определения состояния:

- **`LEARN` (Учить)** - карточки, которые просрочены и их уже нужно повторять (изучать)
- **`REVIEW` (Знаю)** - карточки с прогрессом 10-69%, для которых интервал к повторению еще не подошел
- **`SUSPENDED` (Выучено)** - карточки с прогрессом 70-100%, достигшие мастерства

### Отображение в статистике:

- **"Учить"** - просроченные карточки (dueAt <= now)
- **"Знаю"** - карточки с прогрессом 10-69%, интервал не подошел  
- **"Выучено"** - карточки с прогрессом 70-100%

## 🔄 Чередование режимов

Система поддерживает чередование режимов на основе четности `reviewCount`:

### Логика чередования по прогрессу:

- **30-49%**: WORD ↔ TRANSLATION
- **50-69%**: TRANSLATION ↔ TRANSLATION_TO_WORD  
- **≥70%**: TRANSLATION_TO_WORD (без чередования)

```typescript
// Пример чередования TRANSLATION ↔ TRANSLATION_TO_WORD
TRANSLATION_TO_WORD: {
  // ... другие настройки
  alternatesWith: ['TRANSLATION'],
  alternateCondition: 'even', // Четные reviewCount
}
```

## 🎨 Предустановленные конфигурации

### Для начинающих (BEGINNER_CONFIG)
- Увеличенные диапазоны прогресса
- Больше времени на размышление
- Упрощенный интерфейс

### Для продвинутых (ADVANCED_CONFIG)
- Уменьшенные диапазоны прогресса
- Быстрые переходы
- Минимум помощи

### Быстрое изучение (SPEED_CONFIG)
- Минимальные задержки
- Отключенные анимации
- Фокус на скорости

### Детальное изучение (DETAILED_CONFIG)
- Максимальные задержки
- Подробная обратная связь
- Множественные проверки

## 🛠️ Использование в коде

### Базовое использование

```typescript
import { CardDisplayModes } from '../context/cards/card_modes';

// Получить режим отображения
const displayMode = CardDisplayModes.getDisplayMode(progress, reviewCount);

// Получить конфигурацию режима
const config = CardDisplayModes.getModeConfig(displayMode);

// Проверить, нужно ли показывать перевод автоматически
const shouldShow = CardDisplayModes.shouldShowTranslationAutomatically(displayMode);
```

### Использование с хуком

```typescript
import { useCardDisplaySettings } from '../hooks/useCardDisplaySettings';

function MyComponent() {
  const { 
    getDisplayMode, 
    openSettingsModal, 
    isModalOpen, 
    closeSettingsModal 
  } = useCardDisplaySettings();

  const displayMode = getDisplayMode(card.progress, card.reviewCount);
  
  return (
    <div>
      <button onClick={openSettingsModal}>
        Настройки
      </button>
      {/* ... */}
    </div>
  );
}
```

### Применение предустановок

```typescript
import { ConfigPresets } from '../config/cardDisplayConfigExamples';

// Применить предустановку
const preset = ConfigPresets.applyPreset('beginner');

// Получить список доступных предустановок
const presets = ConfigPresets.getAvailablePresets();
```

## 🎛️ Интерфейс настроек

Модальное окно настроек предоставляет:

### Вкладка "Режимы отображения"
- Настройка каждого режима
- Изменение диапазонов прогресса
- Настройка поведения кнопок и полей

### Вкладка "Общие настройки"
- Анимации и эффекты
- Автосохранение
- Звуковые эффекты

### Вкладка "Настройки сложности"
- Персонализация для разных уровней
- Адаптация под пользователя

## 💾 Сохранение настроек

Настройки автоматически сохраняются в `localStorage` и восстанавливаются при следующем запуске приложения.

```typescript
// Автоматическое сохранение
localStorage.setItem('cardDisplayConfig', JSON.stringify(config));

// Автоматическая загрузка
const savedConfig = localStorage.getItem('cardDisplayConfig');
```

## 🔧 Расширение системы

### Добавление нового режима

1. Добавьте режим в `CARD_DISPLAY_CONFIG.modes`
2. Обновите enum `DisplayMode` в `types/index.ts`
3. Добавьте логику в компоненты

### Добавление новых параметров

1. Расширьте интерфейс `CardDisplayModeConfig`
2. Добавьте утилиты в `CardDisplayConfigUtils`
3. Обновите интерфейс настроек

### Создание новых предустановок

1. Создайте новую конфигурацию в `cardDisplayConfigExamples.ts`
2. Добавьте в `ConfigPresets.applyPreset()`
3. Обновите список в `getAvailablePresets()`

## 🎯 Примеры настройки

### Увеличить время на демонстрацию

```typescript
modes: {
  DEMONSTRATION: {
    // ... другие настройки
    translationDelay: 3000, // 3 секунды вместо 1.5
    cardReturnDelay: 4000,  // 4 секунды перед переходом к следующей карточке
  }
}
```

### Добавить поле ввода в режим WORD

```typescript
modes: {
  WORD: {
    // ... другие настройки
    showInputField: true,
    requireInputForButtons: true,
  }
}
```

### Отключить анимации для быстрой работы

```typescript
general: {
  cardAnimation: false,
  animationDuration: 0,
  soundEffects: false,
}
```

### Настроить время возврата к карточке

```typescript
modes: {
  WORD: {
    // ... другие настройки
    cardReturnDelay: 1000, // 1 секунда перед переходом к следующей карточке
  },
  TRANSLATION_TO_WORD: {
    // ... другие настройки
    cardReturnDelay: 2500, // 2.5 секунды для режима "перевод к слову"
  },
  INPUT: {
    // ... другие настройки
    cardReturnDelay: 3000, // 3 секунды для режима ввода
  }
}
```

### Настроить новый режим TRANSLATION_TO_WORD

```typescript
modes: {
  TRANSLATION_TO_WORD: {
    name: 'Перевод к слову',
    description: 'Пользователь вводит изучаемое слово, видя перевод',
    minProgress: 60,
    maxProgress: 100,
    showTranslationAutomatically: true,
    translationDelay: 0, // Показываем перевод сразу
    cardReturnDelay: 2000,
    showInputField: true,
    showActionButtons: true,
    requireInputForButtons: true,
    nextCardOnEnter: true,
    enterPressesToNext: 2, // Первое нажатие показывает правильный ответ, второе - следующая карточка
    alternatesWith: ['INPUT'],
    alternateCondition: 'even',
  }
}
```

### Настроить интервальные повторения

```typescript
spacedRepetition: {
  // Задержка после неправильного ответа
  incorrectAnswerDelay: 30000, // 30 секунд вместо 1 минуты
  
  // Изменение прогресса
  progressIncrease: 15,        // +15% за правильный ответ
  progressDecrease: 10,        // -10% за неправильный ответ
  
  // Порог для сброса счетчика
  resetSuccessfulReviewsThreshold: 30, // Сброс при прогрессе < 30%
  
  // Кастомные интервалы повторений
  reviewIntervals: [
    { minutes: 2 },      // 1-й успешный ответ: 2 минуты
    { minutes: 15 },     // 2-й успешный ответ: 15 минут
    { hours: 1 },        // 3-й успешный ответ: 1 час
    { hours: 6 },        // 4-й успешный ответ: 6 часов
    { days: 1 },         // 5-й успешный ответ: 1 день
    { days: 3 },         // 6-й успешный ответ: 3 дня
    { days: 7 },         // 7-й успешный ответ: 1 неделя
    { days: 30 }         // 8-й успешный ответ: 1 месяц
  ]
}
```

### Быстрые интервалы для интенсивного изучения

```typescript
spacedRepetition: {
  incorrectAnswerDelay: 5000,  // 5 секунд
  progressIncrease: 20,        // +20% за правильный ответ
  progressDecrease: 15,        // -15% за неправильный ответ
  resetSuccessfulReviewsThreshold: 25,
  
  reviewIntervals: [
    { minutes: 1 },      // 1 минута
    { minutes: 5 },      // 5 минут
    { minutes: 15 },     // 15 минут
    { hours: 1 },        // 1 час
    { hours: 4 },        // 4 часа
    { days: 1 }          // 1 день
  ]
}
```

### Медленные интервалы для долгосрочного запоминания

```typescript
spacedRepetition: {
  incorrectAnswerDelay: 120000, // 2 минуты
  progressIncrease: 5,          // +5% за правильный ответ
  progressDecrease: 25,         // -25% за неправильный ответ
  resetSuccessfulReviewsThreshold: 15,
  
  reviewIntervals: [
    { minutes: 5 },      // 5 минут
    { minutes: 30 },     // 30 минут
    { hours: 2 },        // 2 часа
    { hours: 12 },       // 12 часов
    { days: 1 },         // 1 день
    { days: 3 },         // 3 дня
    { days: 7 },         // 1 неделя
    { days: 14 },        // 2 недели
    { days: 30 },        // 1 месяц
    { days: 90 }         // 3 месяца
  ]
}
```

## 📊 Индикатор прогресса

Система включает круговой индикатор прогресса, который отображается в верхнем левом углу карточки:

### Особенности индикатора:

- **Цветовая индикация**: 
  - 🟡 Оранжевый (0-29%) - начальный уровень
  - 🔵 Синий (30-69%) - средний уровень  
  - 🟢 Зеленый (70-100%) - продвинутый уровень
- **Настраиваемый размер**: от 20px до 60px
- **Опциональный процент**: можно включить/выключить отображение процентов
- **Плавная анимация**: переходы между состояниями

### Настройки индикатора:

```typescript
general: {
  showProgressIndicator: true,     // Показывать индикатор
  progressIndicatorSize: 36,       // Размер в пикселях
  showProgressPercentage: false,   // Показывать процент
}
```

## 🚀 Преимущества новой системы

1. **Гибкость**: Легко изменять поведение без изменения кода
2. **Персонализация**: Настройки под разные уровни пользователей
3. **Расширяемость**: Простое добавление новых режимов и параметров
4. **Удобство**: Интуитивный интерфейс настроек
5. **Сохранность**: Автоматическое сохранение настроек
6. **Предустановки**: Готовые конфигурации для быстрого старта
7. **Интервальные повторения**: Полноценная система для эффективного запоминания
8. **Настраиваемые интервалы**: Адаптация под индивидуальные потребности обучения
9. **Визуальная обратная связь**: Индикатор прогресса для мотивации

## 📝 Заключение

Новая система конфигурации отображения карточек предоставляет полный контроль над поведением приложения. Разработчики могут легко настраивать режимы, а пользователи - персонализировать свой опыт изучения.

**Особенности системы интервальных повторений:**
- Настраиваемые интервалы от минут до месяцев
- Гибкое управление прогрессом обучения
- Адаптация под индивидуальные потребности
- Научно обоснованный подход к запоминанию

Все изменения сохраняются автоматически и применяются немедленно, что делает систему очень удобной в использовании.
