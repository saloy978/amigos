import { useState, useEffect, useCallback } from 'react';
import { StreakService, UserStreak } from '../services/streakService';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActivityDate: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface StreakActions {
  recordActivity: () => Promise<void>;
  refreshStreak: () => Promise<void>;
}

export const useStreak = (userId: string | undefined) => {
  const [state, setState] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysActive: 0,
    lastActivityDate: null,
    isLoading: true,
    error: null
  });

  // Загружаем streak данные
  const loadStreak = useCallback(async () => {
    if (!userId || userId.trim() === '') {
      console.log('⚠️ useStreak: No valid userId provided');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const streak = await StreakService.getUserStreak(userId);
      
      if (streak) {
        setState(prev => ({
          ...prev,
          currentStreak: streak.current_streak,
          longestStreak: streak.longest_streak,
          totalDaysActive: streak.total_days_used,
          lastActivityDate: streak.last_activity_date,
          isLoading: false
        }));
        
        console.log('📊 Streak loaded:', {
          currentStreak: streak.current_streak,
          longestStreak: streak.longest_streak,
          totalDaysActive: streak.total_days_used,
          lastActivityDate: streak.last_activity_date
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('❌ Error loading streak:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load streak' 
      }));
    }
  }, [userId]);

  // Отмечаем активность пользователя
  const recordActivity = useCallback(async () => {
    if (!userId || userId.trim() === '') {
      console.log('⚠️ recordActivity: No valid userId provided');
      return;
    }

    try {
      console.log('🎯 Recording activity for user:', userId);
      const updatedStreak = await StreakService.recordActivity(userId);
      
      if (updatedStreak) {
        setState(prev => ({
          ...prev,
          currentStreak: updatedStreak.current_streak,
          longestStreak: updatedStreak.longest_streak,
          totalDaysActive: updatedStreak.total_days_used,
          lastActivityDate: updatedStreak.last_activity_date
        }));
        
        console.log('✅ Activity recorded successfully:', {
          currentStreak: updatedStreak.current_streak,
          longestStreak: updatedStreak.longest_streak,
          totalDaysActive: updatedStreak.total_days_used
        });
      }
    } catch (error) {
      console.error('❌ Error recording activity:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to record activity' 
      }));
    }
  }, [userId]);

  // Обновляем streak данные
  const refreshStreak = useCallback(async () => {
    await loadStreak();
  }, [loadStreak]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  // Автоматически отмечаем активность при первом заходе в день
  useEffect(() => {
    if (userId && !state.isLoading && state.lastActivityDate) {
      const today = new Date().toISOString().split('T')[0];
      if (state.lastActivityDate !== today) {
        console.log('🔄 First activity of the day detected, recording...');
        recordActivity();
      }
    }
  }, [userId, state.isLoading, state.lastActivityDate, recordActivity]);

  return {
    ...state,
    recordActivity,
    refreshStreak
  };
};
