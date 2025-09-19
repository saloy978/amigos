# Database Restructure Guide

## Проблема

Текущая схема базы данных имеет серьезную проблему: таблица `cards` содержит `user_id`, что превращает общий контент карточек в персональные объекты и создает дублирование данных.

### Текущая схема (проблемная):
```sql
CREATE TABLE cards (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id), -- ❌ Проблема!
  language_pair_id text,
  term text,
  translation text,
  -- ... остальные поля
);
```

### Проблемы:
1. **Дублирование контента**: Одна и та же карточка "hola → привет" создается для каждого пользователя
2. **Неэффективное использование места**: Одинаковый контент хранится многократно
3. **Сложность управления**: Невозможно легко добавить новые карточки для всех пользователей
4. **Нарушение нормализации**: Контент и прогресс смешаны в одной таблице

## Решение

Разделяем "контент" и "прогресс" на отдельные таблицы:

### Новая схема:
```sql
-- Общая библиотека карточек (без user_id)
CREATE TABLE cards (
  id              BIGSERIAL PRIMARY KEY,
  language_pair_id TEXT NOT NULL,
  term            TEXT NOT NULL,
  translation     TEXT NOT NULL,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Персональный прогресс пользователя
CREATE TABLE user_cards (
  user_id          UUID    NOT NULL,
  card_id          BIGINT  NOT NULL REFERENCES cards(id),
  state            TEXT    NOT NULL DEFAULT 'LEARN',
  progress         INT     NOT NULL DEFAULT 0,
  -- ... остальные поля прогресса
  PRIMARY KEY (user_id, card_id)
);
```

## Миграция

### Шаг 1: Диагностика текущих дубликатов

Запустите скрипт `diagnose-duplicates.sql` в Supabase SQL Editor для анализа текущего состояния:

```sql
-- Посмотреть дубликаты между пользователями
SELECT 
  language_pair_id, 
  term, 
  translation, 
  COUNT(DISTINCT user_id) AS users_count
FROM cards
GROUP BY 1,2,3
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY users_count DESC;
```

### Шаг 2: Применение миграции

1. **Создайте резервную копию** (важно!):
   ```sql
   -- В Supabase Dashboard → Database → Backups
   -- Или создайте дамп через pg_dump
   ```

2. **Примените миграцию**:
   ```bash
   # В терминале проекта
   npx supabase db push
   ```

   Или вручную в Supabase SQL Editor:
   ```sql
   -- Скопируйте содержимое файла:
   -- supabase/migrations/20250113000000_restructure_cards_schema.sql
   ```

### Шаг 3: Проверка миграции

После применения миграции проверьте:

```sql
-- Проверить, что данные мигрированы
SELECT COUNT(*) FROM cards; -- Должно быть меньше, чем было
SELECT COUNT(*) FROM user_cards; -- Должно соответствовать старому количеству

-- Проверить, что дубликаты устранены
SELECT 
  language_pair_id, 
  term, 
  translation, 
  COUNT(*) as count
FROM cards
GROUP BY 1,2,3
HAVING COUNT(*) > 1; -- Должно быть пусто

-- Проверить пользовательские карточки
SELECT 
  user_id,
  COUNT(*) as user_cards_count
FROM user_cards
GROUP BY user_id;
```

## Обновление кода

### 1. Типы TypeScript

Обновлены типы в `src/types/index.ts`:

```typescript
// Новая структура
export interface Card {
  id: number; // Теперь BIGSERIAL
  languagePairId: string;
  term: string;
  translation: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface UserCard {
  userId: string;
  cardId: number;
  state: CardState;
  progress: number;
  // ... остальные поля прогресса
}

export interface UserCardWithContent extends UserCard {
  languagePairId: string;
  term: string;
  translation: string;
  imageUrl?: string;
}
```

### 2. CardService

Полностью переписан `src/services/cardService.ts`:

```typescript
// Новые методы
CardService.getUserCards() // Возвращает UserCardWithContent[]
CardService.addCardToUser(term, translation, languagePairId)
CardService.updateUserCard(userCard)
CardService.removeCardFromUser(cardId)
CardService.addCardsFromLesson(words, languagePairId)
```

### 3. Компоненты

Обновлены компоненты уроков для использования новых методов:

```typescript
// Вместо CardService.createCard()
const result = await CardService.addCardsFromLesson(words, 'ru-es');
```

## Преимущества новой схемы

### 1. Устранение дубликатов
- Одна карточка "hola → привет" существует только один раз
- Все пользователи ссылаются на одну и ту же карточку
- Экономия места в базе данных

### 2. Улучшенная производительность
- Меньше данных для обработки
- Быстрее поиск и фильтрация
- Эффективные индексы

### 3. Упрощенное управление
- Легко добавить новые карточки для всех пользователей
- Централизованное управление контентом
- Возможность модерации и улучшения карточек

### 4. Масштабируемость
- Поддержка тысяч пользователей без дублирования
- Возможность добавления метаданных к карточкам
- Готовность к функциям социального обучения

## RLS (Row Level Security)

Настроены политики безопасности:

```sql
-- Карточки: читать всем, писать только сервис-роли
CREATE POLICY "Cards are readable by authenticated users"
  ON cards FOR SELECT TO authenticated USING (true);

-- Пользовательские карточки: только владельцу
CREATE POLICY "User cards are accessible by owner"
  ON user_cards FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

## Полезные функции

Добавлены вспомогательные функции:

```sql
-- Получить или создать карточку
SELECT get_or_create_card('ru-es', 'hola', 'привет');

-- Добавить карточку пользователю
SELECT add_card_to_user(auth.uid(), 'ru-es', 'hola', 'привет');
```

## Представления (Views)

Созданы удобные представления:

```sql
-- Карточки пользователя с контентом
SELECT * FROM user_cards_with_content WHERE user_id = auth.uid();

-- Карточки, готовые к повторению
SELECT * FROM cards_due_for_review WHERE user_id = auth.uid();
```

## Откат (если нужен)

Если что-то пошло не так:

1. **Восстановите из резервной копии**
2. **Или откатите миграцию**:
   ```sql
   -- Удалить новые таблицы
   DROP TABLE IF EXISTS reviews;
   DROP TABLE IF EXISTS user_cards;
   DROP TABLE IF EXISTS cards;
   
   -- Восстановить старую таблицу
   ALTER TABLE cards_old RENAME TO cards;
   ```

## Проверка после миграции

1. **Функциональность**:
   - [ ] Пользователи могут видеть свои карточки
   - [ ] Добавление слов из уроков работает
   - [ ] Прогресс сохраняется корректно
   - [ ] Нет дубликатов при повторном добавлении

2. **Производительность**:
   - [ ] Загрузка карточек быстрая
   - [ ] Поиск работает корректно
   - [ ] Нет лишних запросов к БД

3. **Безопасность**:
   - [ ] Пользователи видят только свои карточки
   - [ ] RLS работает корректно
   - [ ] Нет утечек данных

## Заключение

Эта реструктуризация решает фундаментальную проблему дублирования данных и создает основу для масштабируемого приложения изучения языков. Новая схема более эффективна, безопасна и готова к будущему развитию.


















