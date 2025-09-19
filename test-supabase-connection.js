// Тест подключения к Supabase
// Запустите этот файл в браузере (откройте в консоли)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (supabaseUrl && supabaseAnonKey) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Тест подключения
  supabase.from('cards').select('count').then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  });
  
  // Тест функций
  supabase.rpc('get_or_create_card', {
    p_language_pair_id: 'ru-es',
    p_term: 'тест',
    p_translation: 'prueba',
    p_image_url: null
  }).then(({ data, error }) => {
    if (error) {
      console.error('❌ Function test error:', error);
    } else {
      console.log('✅ Function test successful:', data);
    }
  });
} else {
  console.error('❌ Supabase not configured');
}


















