# 🗄️ Настройка локальной разработки с БД

## 📋 Быстрый старт

### 1. Создайте файл `.env.local` в корне проекта:
```env
VITE_SUPABASE_URL=https://nwtyjslkvwuxdfhlucgv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dHlqc2xrdnd1eGRmaGx1Y2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjQzMTksImV4cCI6MjA3MjY0MDMxOX0.2qlzaAfO8tDhRnz0idY51L8CQ8tlZzk7KIGPK1744FQ
```

### 2. Запустите локальную БД:
```bash
npm run db:start
```

### 3. Примените миграции:
```bash
npm run db:migrate
```

### 4. Заполните тестовыми данными:
```bash
npm run db:seed
```

### 5. Запустите приложение:
```bash
npm run dev
```

## 🛠️ Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run db:start` | Запустить локальную БД |
| `npm run db:stop` | Остановить локальную БД |
| `npm run db:reset` | Сбросить БД и применить миграции |
| `npm run db:status` | Показать статус локальной БД |
| `npm run db:migrate` | Применить миграции к удаленной БД |
| `npm run db:generate` | Генерировать TypeScript типы |
| `npm run db:studio` | Открыть Supabase Studio |
| `npm run db:seed` | Заполнить БД тестовыми данными |
| `npm run db:diff` | Сравнить локальную и удаленную БД |
| `npm run db:link` | Связать с удаленным проектом |

## 🔄 Переключение между БД

### В консоли браузера:
```javascript
// Переключиться на локальную БД
window.dbConfig.switchToLocal()

// Переключиться на удаленную БД
window.dbConfig.switchToRemote()

// Показать текущую конфигурацию
window.dbConfig.getInfo()
```

## 📊 Отладка БД

### В консоли браузера:
```javascript
// Запустить все тесты БД
await window.dbDebug.runAllTests()

// Проверить подключение
await window.dbDebug.testConnection()

// Проверить аутентификацию
await window.dbDebug.checkAuth()

// Тестировать CRUD операции
await window.dbDebug.testCRUD()
```

## 🏗️ Изменение структуры БД

### 1. Создайте новую миграцию:
```bash
npx supabase migration new your_migration_name
```

### 2. Отредактируйте файл миграции в `supabase/migrations/`

### 3. Примените миграцию локально:
```bash
npm run db:reset
```

### 4. Примените к удаленной БД:
```bash
npm run db:migrate
```

### 5. Обновите TypeScript типы:
```bash
npm run db:generate
```

## 🌐 Доступ к локальным сервисам

После запуска `npm run db:start` будут доступны:

- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **Inbucket (Email)**: http://localhost:54324
- **Realtime**: ws://localhost:54321/realtime/v1/

## 🔧 Настройка для локальной разработки

### Переключение на локальную БД:
1. Измените `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDQ5NzYwMDAsImV4cCI6MTk2MDU1MjAwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

2. Перезапустите приложение:
```bash
npm run dev
```

## 🚨 Устранение проблем

### БД не запускается:
```bash
# Остановить все контейнеры
npm run db:stop

# Очистить и перезапустить
docker system prune -f
npm run db:start
```

### Ошибки миграций:
```bash
# Сбросить БД
npm run db:reset

# Проверить статус
npm run db:status
```

### Проблемы с аутентификацией:
- Проверьте RLS политики в Supabase Studio
- Убедитесь, что пользователь создан в `auth.users`
- Проверьте настройки в `supabase/config.toml`

