import { supabase } from './supabaseClient';
import { isSupabaseAvailable } from './supabase';

export interface LessonProgress {
  id?: string;
  user_id: string;
  lesson_id: string;
  theory_viewed: boolean;
  dialogues_listened: boolean;
  practice_completed: boolean;
  practice_score: number;
  total_progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface LessonProgressUpdate {
  theory_viewed?: boolean;
  dialogues_listened?: boolean;
  practice_completed?: boolean;
  practice_score?: number;
  total_progress?: number;
}

export class LessonProgressService {
  /**
   * Get lesson progress for a specific lesson
   */
  static async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    try {
      // Fallback to localStorage if Supabase is not available
      if (!isSupabaseAvailable()) {
        return this.getLessonProgressFromLocalStorage(lessonId);
      }

      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user for lesson progress');
        return null;
      }

      const { data, error } = await supabase!
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is normal for new lessons
          console.log(`📊 No progress found for lesson ${lessonId}`);
          return null;
        }
        console.error('❌ Error fetching lesson progress:', error);
        return null;
      }

      console.log(`📊 Retrieved lesson progress for ${lessonId}:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in getLessonProgress:', error);
      return null;
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(
    lessonId: string, 
    updates: LessonProgressUpdate
  ): Promise<LessonProgress | null> {
    try {
      // Fallback to localStorage if Supabase is not available
      if (!isSupabaseAvailable()) {
        return this.updateLessonProgressInLocalStorage(lessonId, updates);
      }

      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user for lesson progress update');
        return null;
      }

      // Calculate total progress
      const progress = await this.getLessonProgress(lessonId);
      const currentProgress = progress || {
        user_id: user.id,
        lesson_id: lessonId,
        theory_viewed: false,
        dialogues_listened: false,
        practice_completed: false,
        practice_score: 0,
        total_progress: 0
      };

      // Update fields
      const updatedProgress = {
        ...currentProgress,
        ...updates,
        total_progress: this.calculateTotalProgress({
          ...currentProgress,
          ...updates
        })
      };

      // Upsert (insert or update)
      const { data, error } = await supabase!
        .from('lesson_progress')
        .upsert(updatedProgress, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating lesson progress:', error);
        return null;
      }

      console.log(`📊 Updated lesson progress for ${lessonId}:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in updateLessonProgress:', error);
      return null;
    }
  }

  /**
   * Get all lesson progress for the current user
   */
  static async getAllLessonProgress(): Promise<LessonProgress[]> {
    try {
      // Fallback to localStorage if Supabase is not available
      if (!isSupabaseAvailable()) {
        return this.getAllLessonProgressFromLocalStorage();
      }

      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user for lesson progress');
        return [];
      }

      const { data, error } = await supabase!
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all lesson progress:', error);
        return [];
      }

      console.log(`📊 Retrieved ${data?.length || 0} lesson progress records`);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllLessonProgress:', error);
      return [];
    }
  }

  /**
   * Calculate total progress based on individual components
   */
  private static calculateTotalProgress(progress: Partial<LessonProgress>): number {
    let total = 0;
    
    // Theory viewed: +20%
    if (progress.theory_viewed) total += 20;
    
    // Dialogues listened: +30%
    if (progress.dialogues_listened) total += 30;
    
    // Practice completed: up to 50% (proportional to score)
    if (progress.practice_completed && progress.practice_score !== undefined) {
      total += Math.round((progress.practice_score / 100) * 50);
    }
    
    return Math.min(total, 100);
  }

  /**
   * Delete lesson progress (for testing or reset)
   */
  static async deleteLessonProgress(lessonId: string): Promise<boolean> {
    try {
      // Fallback to localStorage if Supabase is not available
      if (!isSupabaseAvailable()) {
        return this.deleteLessonProgressFromLocalStorage(lessonId);
      }

      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user for lesson progress deletion');
        return false;
      }

      const { error } = await supabase!
        .from('lesson_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (error) {
        console.error('❌ Error deleting lesson progress:', error);
        return false;
      }

      console.log(`📊 Deleted lesson progress for ${lessonId}`);
      return true;
    } catch (error) {
      console.error('❌ Error in deleteLessonProgress:', error);
      return false;
    }
  }

  // ===== LOCALSTORAGE FALLBACK METHODS =====

  /**
   * Get lesson progress from localStorage (fallback)
   */
  private static getLessonProgressFromLocalStorage(lessonId: string): LessonProgress | null {
    try {
      const saved = localStorage.getItem(`lesson-${lessonId}-progress`);
      if (saved) {
        const data = JSON.parse(saved);
        console.log(`📊 Retrieved lesson progress from localStorage for ${lessonId}:`, data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Save lesson progress to localStorage (fallback)
   */
  private static saveLessonProgressToLocalStorage(lessonId: string, progress: LessonProgress): void {
    try {
      localStorage.setItem(`lesson-${lessonId}-progress`, JSON.stringify(progress));
      console.log(`📊 Saved lesson progress to localStorage for ${lessonId}:`, progress);
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }

  /**
   * Update lesson progress in localStorage (fallback)
   */
  private static updateLessonProgressInLocalStorage(
    lessonId: string, 
    updates: LessonProgressUpdate
  ): LessonProgress | null {
    try {
      // Get current progress
      const currentProgress = this.getLessonProgressFromLocalStorage(lessonId) || {
        user_id: 'local-user',
        lesson_id: lessonId,
        theory_viewed: false,
        dialogues_listened: false,
        practice_completed: false,
        practice_score: 0,
        total_progress: 0
      };

      // Update fields
      const updatedProgress = {
        ...currentProgress,
        ...updates,
        total_progress: this.calculateTotalProgress({
          ...currentProgress,
          ...updates
        })
      };

      // Save to localStorage
      this.saveLessonProgressToLocalStorage(lessonId, updatedProgress);
      return updatedProgress;
    } catch (error) {
      console.error('❌ Error updating lesson progress in localStorage:', error);
      return null;
    }
  }

  /**
   * Delete lesson progress from localStorage (fallback)
   */
  private static deleteLessonProgressFromLocalStorage(lessonId: string): boolean {
    try {
      localStorage.removeItem(`lesson-${lessonId}-progress`);
      console.log(`📊 Deleted lesson progress from localStorage for ${lessonId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting from localStorage:', error);
      return false;
    }
  }

  /**
   * Get all lesson progress from localStorage (fallback)
   */
  private static getAllLessonProgressFromLocalStorage(): LessonProgress[] {
    try {
      const allProgress: LessonProgress[] = [];
      
      // Get all localStorage keys that match lesson progress pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lesson-') && key.endsWith('-progress')) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const data = JSON.parse(saved);
            allProgress.push(data);
          }
        }
      }
      
      console.log(`📊 Retrieved ${allProgress.length} lesson progress records from localStorage`);
      return allProgress;
    } catch (error) {
      console.error('❌ Error reading all progress from localStorage:', error);
      return [];
    }
  }
}
