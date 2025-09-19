import { supabase } from './supabaseClient';
import { isSupabaseAvailable } from './supabase';

export interface UserStreak {
  id?: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_days_used: number;
  created_at?: string;
  updated_at?: string;
}

export interface StreakUpdate {
  current_streak?: number;
  longest_streak?: number;
  last_activity_date?: string;
  total_days_used?: number;
}

export class StreakService {
  // Получаем streak данные пользователя
  static async getUserStreak(userId: string): Promise<UserStreak | null> {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase not available, using localStorage fallback');
      return this.getStreakFromLocalStorage(userId);
    }

    try {
      const { data, error } = await supabase!
        .from('user_streak')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user streak:', error);
        return this.getStreakFromLocalStorage(userId);
      }

      if (!data) {
        // Запись не найдена, создаем новую
        console.log('📊 No streak data found, creating new record');
        return await this.createUserStreak(userId);
      }

      console.log('📊 Fetched user streak from Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getUserStreak:', error);
      return this.getStreakFromLocalStorage(userId);
    }
  }

  // Создаем новую запись streak для пользователя
  static async createUserStreak(userId: string): Promise<UserStreak> {
    if (!userId || userId.trim() === '') {
      console.error('❌ Invalid userId provided to createUserStreak');
      throw new Error('Invalid userId');
    }

    const today = new Date().toISOString().split('T')[0];
    const newStreak: Omit<UserStreak, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      total_days_used: 1
    };

    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase not available, saving to localStorage');
      this.saveStreakToLocalStorage(userId, newStreak);
      return { ...newStreak, id: 'local', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }

    try {
      const { data, error } = await supabase!
        .from('user_streak')
        .insert([newStreak])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user streak:', error);
        this.saveStreakToLocalStorage(userId, newStreak);
        return { ...newStreak, id: 'local', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      }

      console.log('✅ Created user streak in Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createUserStreak:', error);
      this.saveStreakToLocalStorage(userId, newStreak);
      return { ...newStreak, id: 'local', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }
  }

  // Обновляем streak данные пользователя
  static async updateUserStreak(userId: string, updates: StreakUpdate): Promise<UserStreak | null> {
    if (!isSupabaseAvailable()) {
      console.warn('⚠️ Supabase not available, updating localStorage');
      return this.updateStreakInLocalStorage(userId, updates);
    }

    try {
      const { data, error } = await supabase!
        .from('user_streak')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user streak:', error);
        return this.updateStreakInLocalStorage(userId, updates);
      }

      console.log('✅ Updated user streak in Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in updateUserStreak:', error);
      return this.updateStreakInLocalStorage(userId, updates);
    }
  }

  // Отмечаем активность пользователя на сегодня
  static async recordActivity(userId: string): Promise<UserStreak | null> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Получаем текущие данные streak
      let streak = await this.getUserStreak(userId);
      
      if (!streak) {
        // Создаем новую запись
        return await this.createUserStreak(userId);
      }

      // Проверяем, была ли активность сегодня
      if (streak.last_activity_date === today) {
        console.log('📊 Activity already recorded for today');
        return streak;
      }

      // Вычисляем новый streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = 1;
      let newLongestStreak = streak.longest_streak;
      let newTotalDays = streak.total_days_used + 1;

      if (streak.last_activity_date === yesterdayStr) {
        // Продолжаем streak
        newCurrentStreak = streak.current_streak + 1;
        newLongestStreak = Math.max(newCurrentStreak, streak.longest_streak);
      } else if (streak.last_activity_date && streak.last_activity_date < yesterdayStr) {
        // Streak прерван, начинаем заново
        newCurrentStreak = 1;
        console.log('🔄 Streak broken, starting new streak');
      }

      // Обновляем данные
      const updates: StreakUpdate = {
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        total_days_used: newTotalDays
      };

      const updatedStreak = await this.updateUserStreak(userId, updates);
      
      console.log('🎯 Activity recorded:', {
        userId,
        today,
        newCurrentStreak,
        newLongestStreak,
        newTotalDays
      });

      return updatedStreak;
    } catch (error) {
      console.error('❌ Error recording activity:', error);
      return null;
    }
  }

  // localStorage fallback методы
  private static getStreakFromLocalStorage(userId: string): UserStreak | null {
    try {
      const key = `user_streak_${userId}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error reading streak from localStorage:', error);
    }
    return null;
  }

  private static saveStreakToLocalStorage(userId: string, streak: Omit<UserStreak, 'id' | 'created_at' | 'updated_at'>): void {
    try {
      const key = `user_streak_${userId}`;
      const data: UserStreak = {
        ...streak,
        id: 'local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving streak to localStorage:', error);
    }
  }

  private static updateStreakInLocalStorage(userId: string, updates: StreakUpdate): UserStreak | null {
    try {
      const key = `user_streak_${userId}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const data: UserStreak = JSON.parse(existing);
        const updated = { ...data, ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      }
    } catch (error) {
      console.error('❌ Error updating streak in localStorage:', error);
    }
    return null;
  }
}
