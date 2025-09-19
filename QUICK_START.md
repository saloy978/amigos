# 🚀 Быстрый старт - Проект запущен!

## ✅ Что уже настроено:

1. **Файл `.env.local`** создан с вашими настройками Supabase
2. **Проект запущен** на http://localhost:5173
3. **Все утилиты для БД** подключены и готовы к использованию

## 🔧 Доступные команды в консоли браузера:

### Переключение между БД:
```javascript
// Переключиться на локальную БД (симуляция)
window.dbConfig.switchToLocal()

// Переключиться на удаленную БД (ваша Supabase)
window.dbConfig.switchToRemote()

// Показать текущую конфигурацию
window.dbConfig.getInfo()
```

### Отладка БД:
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

### Работа с локальной БД (без Docker):
```javascript
// Получить статистику
window.localDB.getStats()

// Сбросить данные
window.localDB.reset()

// Получить текущего пользователя
await window.localDB.getCurrentUser()
```

## 📊 Проверка работы БД:

1. **Откройте DevTools** (F12)
2. **Перейдите на вкладку Console**
3. **Выполните команду:**
```javascript
await window.dbDebug.runAllTests()
```

Вы должны увидеть логи:
```
🔍 Testing database connection...
✅ Database connection successful
👤 User authenticated: {id: "...", email: "..."}
✅ Read test successful, found cards: X
```

## 🎯 Что можно тестировать:

- ✅ Регистрация и вход пользователей
- ✅ Создание, редактирование, удаление карточек
- ✅ Система интервальных повторений
- ✅ Статистика и прогресс
- ✅ Переключение между БД

## 🚨 Если что-то не работает:

1. **Проверьте консоль браузера** на ошибки
2. **Убедитесь, что файл `.env.local`** содержит правильные данные
3. **Попробуйте перезапустить** проект:
   ```bash
   # Остановить (Ctrl+C)
   npm run dev
   ```

## 📝 Следующие шаги:

1. Откройте http://localhost:5173
2. Попробуйте зарегистрироваться или войти
3. Создайте несколько карточек
4. Протестируйте систему изучения
5. Используйте консоль для отладки

**Проект готов к разработке! 🎉**

