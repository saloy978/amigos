// Тест CardService
// Запустите этот код в консоли браузера после авторизации

// Импортируем CardService (если доступен)
if (typeof window !== 'undefined' && window.CardService) {
  console.log('🧪 Тестируем CardService...');
  
  // Тест добавления одной карточки
  window.CardService.addCardToUser('тест', 'prueba', 'ru-es')
    .then(result => {
      console.log('✅ Тест добавления карточки:', result);
    })
    .catch(error => {
      console.error('❌ Ошибка добавления карточки:', error);
    });
  
  // Тест добавления карточек из урока
  const testWords = [
    { term: 'привет', translation: 'hola' },
    { term: 'пока', translation: 'adiós' }
  ];
  
  window.CardService.addCardsFromLesson(testWords, 'ru-es')
    .then(result => {
      console.log('✅ Тест добавления карточек из урока:', result);
    })
    .catch(error => {
      console.error('❌ Ошибка добавления карточек из урока:', error);
    });
} else {
  console.log('❌ CardService не доступен в window');
}


















