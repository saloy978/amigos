# Cursor Context: Интерактивный урок №1 — Имя существительное (род и число)

## 🎯 Цель
Сгенерировать и реализовать **веб‑модуль интерактивного урока** по теме «Имя существительное в испанском языке (род и число)» с мини‑играми, авто‑проверкой и итогом. Готово к деплою (Vercel).

## ⚙️ Технологии (обязательно)
- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Button, Card, Progress, Tabs, Alert, Dialog, Toast)
- **Zustand** для состояния или React Context (на выбор)
- **i18n (ru/es)** – словарный файл JSON
- **ESLint + Prettier**, строгий TS
- **no server DB**: данные урока грузятся из локального JSON

> Если проект уже создан — адаптируй; если нет — создай с нуля.

## 🧭 Пользовательские потоки
1. **Старт** → экран приветствия + «Начать»
2. **Теория (Род)** → короткие правила + «К практике»
3. **Игра 1: Род (м/ж)** — выбор 🚹/🚺
4. **Теория (Число)** → правила множественного числа
5. **Игра 2: Множественное число** — ввод/выбор формы
6. **Игра 3: Классификатор (Drag&Drop)** — раскидать по контейнерам
7. **Игра 4: Исправь шпиона** — клик по ошибке в предложении
8. **Итог** — счёт, разбор ошибок, кнопки «Ещё раз»/«Далее»

## 🧩 Мини‑игры — механики
### Игра 1. Род (м/ж)
- Вопрос: слово → 2 кнопки: Masculino/ Femenino (иконки 🚹/🚺)
- Таймер 10 сек (отключаемый)
- Немедленная обратная связь + краткая подсказка (почему так)
- Пример набора: `["chico:m","amiga:f","problema:m","mano:f","radio:f","playa:f","papá:m","día:m"]`

### Игра 2. Множественное число
- Вопрос: слово в ед.ч. → инпут/варианты
- Валидация: правила `+s`, `+es`, `z→c+es`, «не меняется»
- Подсветка ошибок; показываем правило, по которому строится форма
- Пример: `libro→libros`, `ciudad→ciudades`, `lápiz→lápices`, `lunes→lunes`

### Игра 3. Классификатор (Drag&Drop)
- Два контейнера: **Masculino** / **Femenino**
- Drag: слова: `chico, hermana, radio, café, estudiante, economista, planeta, ciudad`
- Подсказки при повторной ошибке (например: “‑ma часто мужской”)

### Игра 4. Исправь шпиона
- Текст с одной ошибкой → клик по неверному слову → инлайн‑редактор
- Пример: `La mano es masculino.` → правильно `La mano es femenino.`

## 🧱 Структура проекта
```
/app
  /lesson-1
    page.tsx
    theory.tsx
    game-gender.tsx
    game-plural.tsx
    game-sort.tsx
    game-find-error.tsx
    result.tsx
/components
  LessonLayout.tsx
  GameHeader.tsx
  ScoreBar.tsx
  Timer.tsx
  DragDropBoard.tsx
  Feedback.tsx
/lib
  i18n.ts
  rules.ts
  scoring.ts
  shuffle.ts
  analytics.ts
/data
  lesson-1.json
  i18n.ru.json
  i18n.es.json
/styles
  globals.css
```

## 🗃️ Данные урока (`/data/lesson-1.json` — пример)
```json
{
  "id": "lesson-1-nouns-gender-number",
  "title": "Имя существительное — род и число",
  "theory": {
    "gender": {
      "rules": [
        "Чаще всего -o → masculino, -a → femenino",
        "Исключения: día (m), papá (m), mano (f), radio (f)",
        "Греческие -ma, -ta → обычно masculino (problema, planeta)",
        "-ción, -sión, -dad → femenino (estación, ciudad, verdad)"
      ]
    },
    "number": {
      "rules": [
        "Гласная → +s (casa → casas)",
        "Согласная → +es (ciudad → ciudades)",
        "z → c + es (lápiz → lápices)",
        "Некоторые не меняются (lunes, crisis, cumpleaños)"
      ]
    }
  },
  "games": {
    "gender": {
      "items": [
        {"term":"chico","answer":"m"},
        {"term":"amiga","answer":"f"},
        {"term":"problema","answer":"m"},
        {"term":"mano","answer":"f"},
        {"term":"radio","answer":"f"},
        {"term":"playa","answer":"f"},
        {"term":"papá","answer":"m"},
        {"term":"día","answer":"m"}
      ]
    },
    "plural": {
      "items": [
        {"singular":"libro","plural":"libros"},
        {"singular":"casa","plural":"casas"},
        {"singular":"ciudad","plural":"ciudades"},
        {"singular":"flor","plural":"flores"},
        {"singular":"lápiz","plural":"lápices"},
        {"singular":"luz","plural":"luces"},
        {"singular":"lunes","plural":"lunes"},
        {"singular":"crisis","plural":"crisis"}
      ]
    },
    "sort": {
      "items": [
        {"term":"chico","gender":"m"},
        {"term":"hermana","gender":"f"},
        {"term":"radio","gender":"f"},
        {"term":"café","gender":"m"},
        {"term":"estudiante","gender":"x"},
        {"term":"economista","gender":"x"},
        {"term":"planeta","gender":"m"},
        {"term":"ciudad","gender":"f"}
      ]
    },
    "findError": {
      "items": [
        {
          "wrong":"La mano es masculino.",
          "right":"La mano es femenino.",
          "explain":"‘mano’ — исключение женского рода"
        },
        {
          "wrong":"Los lápizes están en la mesa.",
          "right":"Los lápices están en la mesa.",
          "explain":"z→c + es"
        }
      ]
    }
  }
}
```

## 🧠 Логика правил (`/lib/rules.ts`) — требования
- `detectGender(term: string): "m" | "f" | "x" | "unknown"`: эвристики по окончаниям и спискам исключений
- `buildPlural(term: string): { plural: string; rule: string }`
- Словари исключений:
  - genderExceptions: `{ "mano": "f", "radio":"f", "día":"m", "papá":"m", ... }`
  - greekMasculine: `["problema","programa","tema","planeta"]`
  - invariantsPlural: `["lunes","crisis","cumpleaños"]`

## 🏗️ Компоненты — требования
- **LessonLayout**: хедер с прогрессом и таб‑индикатором шагов
- **GameHeader**: заголовок, подсказка, счёт
- **ScoreBar**: прогресс и количество правильных/ошибок
- **Timer** (опция): старт/пауза/рестарт
- **DragDropBoard**: две колонки, перенос карточек; анимация
- **Feedback**: модалка/тост с объяснением правила и примерами

## 🖥️ Экраны — требования к UX
- Теория: лаконично, списки правил, примеры, подсветка суффиксов
- Игры: крупные кликабельные элементы, клавиатурное управление
- Респонсив: мобильный/десктоп
- Доступность: aria‑лейблы, контраст, фокус‑стили

## 🧪 Тесты приёмки (можно Playwright)
1. Загрузка `/lesson-1` рендерит приветствие и кнопку «Начать»
2. Игры последовательно проходят, счёт увеличивается
3. В `plural` ввод `lápiz` → `lápices` принимается
4. В `plural` ввод `lunes` → `lunes` принимается
5. В `gender` слово `problema` засчитывается как `m`
6. В `sort` перенос `ciudad` в `Femenino` проходит
7. В `findError` клик по `masculino` открывает исправление
8. Итоговый экран показывает общий счёт и кнопки повтор/далее

## 🌐 i18n (минимум)
- `/data/i18n.ru.json` и `/data/i18n.es.json`
- Ключи: titles, buttons, hints, feedback messages
- Переключатель языка в хедере урока

## 🧾 Копирайтинг UI (RU, можно локализовать)
- Привет: «Сегодня разберём род и число существительных. Готов?»
- Кнопки: «Начать», «К практике», «Продолжить», «Финал», «Ещё раз», «Далее»
- Подсказки: «‑ma часто мужской (греч. происхождение)», «z→c + es»
- Ошибка: «Почти! Подумай про суффикс»
- Успех: «Отлично! Так держать»

## 🚀 Команды (подсказка)
```bash
# Установка
npx create-next-app@latest lesson-nouns --ts --tailwind --eslint
cd lesson-nouns

# shadcn/ui
pnpm add lucide-react class-variance-authority tailwind-merge @radix-ui/react-slot
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card progress tabs dialog toast alert

# Zustand (по желанию)
pnpm add zustand

# Запуск
pnpm dev
```

## ✅ Готово, когда
- Все экраны реализованы, игры работают с подсказками и подсветкой
- Счёт и прогресс сохраняются в состоянии (перезагрузка не сбрасывает — localStorage)
- Данные урока читаются из `/data/lesson-1.json`
- Есть переключатель RU/ES
- Проект билдится (`next build`) и готов к деплою на Vercel
