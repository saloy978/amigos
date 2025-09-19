# Исправление логики показа карточек

## Проблема
Логика показа карточек не соответствовала описанной системе интервальных повторений. Использовались фиксированные режимы отображения и направления обучения вместо динамических, основанных на прогрессе карточки.

## Исправления

### 1. Исправлена логика выбора режима отображения
**До исправления:**
```typescript
// SessionScreen.tsx - фиксированный режим
const displayMode = DisplayMode.WORD; // Всегда WORD
const direction = ReviewDirection.KNOWN_TO_LEARNING; // Всегда K→L
```

**После исправления:**
```typescript
// SessionScreen.tsx - динамический режим на основе прогресса
const displayMode = SpacedRepetitionAdapter.getDisplayMode(nextCard);
const direction = SpacedRepetitionAdapter.getReviewDirection(nextCard);
```

### 2. Добавлены методы в SpacedRepetitionAdapter
```typescript
// spacedRepetitionAdapter.ts
static getDisplayMode(userCard: UserCardWithContent): DisplayMode {
  const card = this.userCardToCard(userCard);
  return SpacedRepetitionService.getDisplayMode(card);
}

static getReviewDirection(userCard: UserCardWithContent): ReviewDirection {
  const card = this.userCardToCard(userCard);
  return SpacedRepetitionService.getReviewDirection(card);
}
```

### 3. Добавлены импорты
```typescript
import { UserCardWithContent, LegacyCard, DisplayMode, ReviewDirection } from '../types';
```

## Новая логика показа карточек

### 🎯 Режимы отображения по прогрессу:

| Прогресс | Режим | Описание |
|----------|-------|----------|
| 0-19% | **DEMONSTRATION** | Автоматический показ перевода через 1.5 сек |
| 20-49% | **WORD** | Показ слова, перевод по тапу |
| 50-69% | **Чередование** | Четные: WORD, Нечетные: TRANSLATION |
| 70-100% | **Продвинутый** | Четные: TRANSLATION, Нечетные: INPUT |

### 🔄 Направления обучения по прогрессу:

| Прогресс | Направление | Описание |
|----------|-------------|----------|
| 0-59% | **K→L** | Русское → Испанское (100%) |
| 60-79% | **Смешанное** | K→L (70%), L→K (30%) |
| 80-100% | **Сбалансированное** | K→L (50%), L→K (50%) |

### ⏰ Интервалы повторений:

| Прогресс | Интервал | Описание |
|----------|----------|----------|
| 0-29% | **10 секунд** | Быстрое закрепление |
| 30-69% | **30 секунд** | Среднее закрепление |
| 70-100% | **1 минута** | Продвинутое закрепление |

## Алгоритм работы

### 1. Выбор карточки
```typescript
// SessionScreen.tsx:75
const dueCards = SpacedRepetitionAdapter.getDueCards(state.cards);
const nextCard = dueCards[0]; // Первая по времени dueAt
```

### 2. Определение режима
```typescript
// SessionScreen.tsx:82-83
const displayMode = SpacedRepetitionAdapter.getDisplayMode(nextCard);
const direction = SpacedRepetitionAdapter.getReviewDirection(nextCard);
```

### 3. Логика режимов (SpacedRepetitionService)
```typescript
static getDisplayMode(card: Card): DisplayMode {
  if (progress < 20) return DisplayMode.DEMONSTRATION;
  else if (progress < 50) return DisplayMode.WORD;
  else if (progress < 70) {
    return card.reviewCount % 2 === 0 ? DisplayMode.WORD : DisplayMode.TRANSLATION;
  } else {
    return card.reviewCount % 2 === 0 ? DisplayMode.TRANSLATION : DisplayMode.INPUT;
  }
}
```

### 4. Логика направлений
```typescript
static getReviewDirection(card: Card): ReviewDirection {
  if (progress >= 80) {
    return Math.random() < 0.5 ? L_TO_K : K_TO_L;
  } else if (progress >= 60) {
    return Math.random() < 0.3 ? L_TO_K : K_TO_L;
  }
  return ReviewDirection.KNOWN_TO_LEARNING;
}
```

## Результат

После исправлений:
- ✅ Режимы отображения определяются динамически по прогрессу
- ✅ Направления обучения адаптируются к уровню пользователя
- ✅ Интервалы повторений соответствуют прогрессу
- ✅ Система интервальных повторений работает корректно
- ✅ Проект компилируется без ошибок
- ✅ Линтер не показывает ошибок

## Тестирование

1. **Запустите приложение**:
   ```bash
   npm run dev
   ```

2. **Протестируйте разные уровни прогресса**:
   - Новые карточки (0-19%): Демонстрация
   - Изучаемые (20-49%): Режим "Слово"
   - Повторяемые (50-69%): Чередование WORD/TRANSLATION
   - Продвинутые (70-100%): Чередование TRANSLATION/INPUT

3. **Проверьте направления обучения**:
   - Низкий прогресс: только K→L
   - Средний прогресс: 30% L→K
   - Высокий прогресс: 50% L→K

4. **Проверьте интервалы**:
   - Ответьте правильно на карточки разного уровня
   - Убедитесь, что интервалы увеличиваются с прогрессом

## Поддержка

Если проблемы остаются:
1. Проверьте логи в консоли браузера
2. Убедитесь, что прогресс карточек обновляется корректно
3. Проверьте, что reviewCount увеличивается при каждом показе
4. Убедитесь, что dueAt обновляется согласно интервалам






