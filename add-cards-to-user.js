// Добавляем карточки пользователю через Supabase API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwtyjslkvwuxdfhlucgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dHlqc2xrdnd1eGRmaGx1Y2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjQzMTksImV4cCI6MjA3MjY0MDMxOX0.2qlzaAfO8tDhRnz0idY51L8CQ8tlZzk7KIGPK1744FQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCardsToUser() {
  console.log('🔍 Добавляем карточки пользователю...');
  
  try {
    // 1. Получаем ID пользователя из user_cards_with_content
    console.log('1. Получаем ID пользователя...');
    const { data: userData, error: userError } = await supabase
      .from('user_cards_with_content')
      .select('user_id')
      .limit(1);
    
    if (userError) {
      console.error('❌ Ошибка при получении user_id:', userError);
      return;
    }
    
    let userId = '7dd5dc5f-2e20-4107-8aee-302ad05772c2'; // Используем известный ID
    if (userData && userData.length > 0) {
      userId = userData[0].user_id;
    }
    
    console.log('✅ User ID:', userId);
    
    // 2. Получаем карточки для добавления
    console.log('2. Получаем карточки для добавления...');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, term, translation')
      .in('id', [83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101]);
    
    if (cardsError) {
      console.error('❌ Ошибка при получении карточек:', cardsError);
      return;
    }
    
    console.log('✅ Найдено карточек:', cards.length);
    console.log('Карточки:', cards);
    
    // 3. Добавляем карточки пользователю
    console.log('3. Добавляем карточки пользователю...');
    const userCards = cards.map(card => ({
      user_id: userId,
      card_id: card.id,
      state: 'LEARN',
      progress: 0,
      review_count: 0,
      successful_reviews: 0,
      direction: 'K_TO_L',
      ease_factor: 2.5,
      interval_days: 0,
      due_at: null, // NULL означает, что карточка готова к показу
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: insertedCards, error: insertError } = await supabase
      .from('user_cards')
      .upsert(userCards, { 
        onConflict: 'user_id,card_id',
        ignoreDuplicates: true 
      });
    
    if (insertError) {
      console.error('❌ Ошибка при добавлении карточек:', insertError);
      return;
    }
    
    console.log('✅ Карточки добавлены успешно');
    
    // 4. Проверяем результат
    console.log('4. Проверяем результат...');
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
    console.log('Карточки:', userCardsResult);
    
    // 5. Проверяем представление cards_due_for_review
    console.log('5. Проверяем представление cards_due_for_review...');
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














