// Тест доступа к Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwtyjslkvwuxdfhlucgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dHlqc2xrdnd1eGRmaGx1Y2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjQzMTksImV4cCI6MjA3MjY0MDMxOX0.2qlzaAfO8tDhRnz0idY51L8CQ8tlZzk7KIGPK1744FQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseAccess() {
  console.log('🔍 Тестируем доступ к Supabase...');
  
  try {
    // 1. Проверяем подключение
    console.log('1. Проверяем подключение...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('cards')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Ошибка подключения:', connectionError);
      return;
    }
    console.log('✅ Подключение успешно');
    
    // 2. Проверяем таблицы
    console.log('2. Проверяем таблицы...');
    
    // Проверяем cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, term, translation')
      .limit(5);
    
    if (cardsError) {
      console.error('❌ Ошибка при запросе cards:', cardsError);
    } else {
      console.log('✅ Таблица cards доступна, записей:', cards.length);
      console.log('Примеры карточек:', cards);
    }
    
    // Проверяем user_cards
    const { data: userCards, error: userCardsError } = await supabase
      .from('user_cards')
      .select('user_id, card_id, progress, state')
      .limit(5);
    
    if (userCardsError) {
      console.error('❌ Ошибка при запросе user_cards:', userCardsError);
    } else {
      console.log('✅ Таблица user_cards доступна, записей:', userCards.length);
      console.log('Примеры user_cards:', userCards);
    }
    
    // 3. Проверяем представление cards_due_for_review
    console.log('3. Проверяем представление cards_due_for_review...');
    const { data: dueCards, error: dueCardsError } = await supabase
      .from('cards_due_for_review')
      .select('card_id, term, translation, progress, due_at')
      .limit(5);
    
    if (dueCardsError) {
      console.error('❌ Ошибка при запросе cards_due_for_review:', dueCardsError);
    } else {
      console.log('✅ Представление cards_due_for_review доступно, записей:', dueCards.length);
      console.log('Карточки готовые к повторению:', dueCards);
    }
    
    // 4. Проверяем "битые" записи
    console.log('4. Проверяем "битые" записи...');
    const { data: brokenCards, error: brokenError } = await supabase
      .rpc('check_broken_cards');
    
    if (brokenError) {
      console.log('⚠️ Функция check_broken_cards не существует, проверяем вручную...');
      
      // Проверяем вручную через JOIN
      const { data: allUserCards, error: allError } = await supabase
        .from('user_cards')
        .select(`
          card_id,
          cards!inner(id, term, translation)
        `)
        .limit(10);
      
      if (allError) {
        console.error('❌ Ошибка при проверке JOIN:', allError);
      } else {
        console.log('✅ JOIN работает корректно, записей:', allUserCards.length);
      }
    } else {
      console.log('✅ Функция check_broken_cards доступна');
      console.log('Результат:', brokenCards);
    }
    
    console.log('🎉 Тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
testSupabaseAccess();














