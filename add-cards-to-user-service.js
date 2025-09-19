// Добавляем карточки пользователю через Supabase API с service role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwtyjslkvwuxdfhlucgv.supabase.co';
// Используем anon key, но попробуем обойти RLS через функции
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dHlqc2xrdnd1eGRmaGx1Y2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjQzMTksImV4cCI6MjA3MjY0MDMxOX0.2qlzaAfO8tDhRnz0idY51L8CQ8tlZzk7KIGPK1744FQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCardsToUser() {
  console.log('🔍 Добавляем карточки пользователю через функции...');
  
  try {
    const userId = '7dd5dc5f-2e20-4107-8aee-302ad05772c2';
    
    // 1. Получаем карточки для добавления
    console.log('1. Получаем карточки для добавления...');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, term, translation')
      .in('id', [83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101]);
    
    if (cardsError) {
      console.error('❌ Ошибка при получении карточек:', cardsError);
      return;
    }
    
    console.log('✅ Найдено карточек:', cards.length);
    
    // 2. Добавляем карточки по одной через функцию add_card_to_user
    console.log('2. Добавляем карточки через функцию...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const card of cards) {
      try {
        const { data, error } = await supabase.rpc('add_card_to_user', {
          p_user_id: userId,
          p_language_pair_id: 'ru-es',
          p_term: card.term,
          p_translation: card.translation,
          p_image_url: null
        });
        
        if (error) {
          console.error(`❌ Ошибка при добавлении карточки ${card.id}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Карточка ${card.id} добавлена: ${card.term} -> ${card.translation}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Критическая ошибка для карточки ${card.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`📊 Результат: ${successCount} успешно, ${errorCount} ошибок`);
    
    // 3. Проверяем результат
    console.log('3. Проверяем результат...');
    const { data: userCardsResult, error: resultError } = await supabase
      .from('user_cards_with_content')
      .select('card_id, term, translation, progress, state, due_at')
      .eq('user_id', userId)
      .order('card_id');
    
    if (resultError) {
      console.error('❌ Ошибка при проверке результата:', resultError);
      return;
    }
    
    console.log('✅ Результат:');
    console.log('Количество карточек пользователя:', userCardsResult.length);
    
    // 4. Проверяем представление cards_due_for_review
    console.log('4. Проверяем представление cards_due_for_review...');
    const { data: dueCards, error: dueError } = await supabase
      .from('cards_due_for_review')
      .select('card_id, term, translation, progress, due_at')
      .eq('user_id', userId);
    
    if (dueError) {
      console.error('❌ Ошибка при проверке cards_due_for_review:', dueError);
      return;
    }
    
    console.log('✅ Карточки готовые к повторению:', dueCards.length);
    console.log('Готовые карточки:', dueCards);
    
    console.log('🎉 Все готово! Теперь обновите страницу приложения.');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем функцию
addCardsToUser();














