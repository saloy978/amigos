import { supabase, isSupabaseConfigured } from './supabaseClient';

// Re-export supabase for backward compatibility
export { supabase };

export const isSupabaseAvailable = () => {
  return isSupabaseConfigured && supabase !== null;
};

// Fallback для локальной разработки без Supabase
export const getSupabaseOrFallback = () => {
  if (isSupabaseAvailable()) {
    return supabase;
  }
  
  console.warn('⚠️ Supabase not configured, using localStorage fallback');
  return null;
};
