import { useState, useEffect, useCallback } from 'react';
import { LessonProgressService } from '../services/lessonProgressService';

export interface LessonProgressState {
  theoryViewed: boolean;
  dialoguesListened: boolean;
  practiceCompleted: boolean;
  practiceScore: number;
  totalProgress: number;
  progressLoaded: boolean;
}

export interface LessonProgressActions {
  markTheoryViewed: () => void;
  markDialoguesListened: () => void;
  markPracticeCompleted: (score: number) => void;
  resetProgress: () => void;
}

export const useLessonProgress = (lessonId: string | undefined) => {
  const [state, setState] = useState<LessonProgressState>({
    theoryViewed: false,
    dialoguesListened: false,
    practiceCompleted: false,
    practiceScore: 0,
    totalProgress: 0,
    progressLoaded: false
  });

  // Функция для расчета общего прогресса
  const calculateProgress = useCallback(() => {
    let progress = 0;
    
    // Теория просмотрена: +20%
    if (state.theoryViewed) progress += 20;
    
    // Диалоги прослушаны: +30%
    if (state.dialoguesListened) progress += 30;
    
    // Практика пройдена: до +50% (пропорционально результату)
    if (state.practiceCompleted) {
      progress += Math.round((state.practiceScore / 100) * 50);
    }
    
    return Math.min(progress, 100);
  }, [state.theoryViewed, state.dialoguesListened, state.practiceCompleted, state.practiceScore]);

  // Загружаем прогресс из Supabase
  const loadProgress = useCallback(async () => {
    if (!lessonId || state.progressLoaded) return;
    
    try {
      console.log('📊 Loading progress from Supabase for lesson:', lessonId);
      const progress = await LessonProgressService.getLessonProgress(lessonId);
      
      if (progress) {
        setState(prev => ({
          ...prev,
          theoryViewed: progress.theory_viewed,
          dialoguesListened: progress.dialogues_listened,
          practiceCompleted: progress.practice_completed,
          practiceScore: progress.practice_score,
          totalProgress: progress.total_progress,
          progressLoaded: true
        }));
        console.log('📊 Loaded progress from Supabase:', progress);
      } else {
        setState(prev => ({ ...prev, progressLoaded: true }));
      }
    } catch (error) {
      console.error('❌ Error loading progress from Supabase:', error);
      setState(prev => ({ ...prev, progressLoaded: true }));
    }
  }, [lessonId, state.progressLoaded]);

  // Сохраняем прогресс в Supabase
  const saveProgress = useCallback(async (updates: Partial<LessonProgressState>) => {
    if (!lessonId || !state.progressLoaded) return;
    
    try {
      const newState = { ...state, ...updates };
      const totalProgress = calculateProgress();
      
      console.log('💾 Saving progress to Supabase:', { lessonId, updates, totalProgress });
      
      await LessonProgressService.updateLessonProgress(lessonId, {
        theory_viewed: newState.theoryViewed,
        dialogues_listened: newState.dialoguesListened,
        practice_completed: newState.practiceCompleted,
        practice_score: newState.practiceScore,
        total_progress: totalProgress
      });
      
      console.log('✅ Progress saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving progress to Supabase:', error);
    }
  }, [lessonId, state, calculateProgress, state.progressLoaded]);

  // Действия для обновления прогресса
  const actions: LessonProgressActions = {
    markTheoryViewed: useCallback(() => {
      if (state.theoryViewed) return;
      
      console.log('✅ Theory viewed!');
      setState(prev => ({ ...prev, theoryViewed: true }));
      saveProgress({ theoryViewed: true });
    }, [state.theoryViewed, saveProgress]),

    markDialoguesListened: useCallback(() => {
      if (state.dialoguesListened) return;
      
      console.log('🎧 Dialogues listened!');
      setState(prev => ({ ...prev, dialoguesListened: true }));
      saveProgress({ dialoguesListened: true });
    }, [state.dialoguesListened, saveProgress]),

    markPracticeCompleted: useCallback((score: number) => {
      console.log('📝 Practice completed with score:', score);
      setState(prev => ({ 
        ...prev, 
        practiceCompleted: true, 
        practiceScore: score 
      }));
      saveProgress({ practiceCompleted: true, practiceScore: score });
    }, [saveProgress]),

    resetProgress: useCallback(() => {
      console.log('🔄 Resetting progress');
      setState(prev => ({
        ...prev,
        theoryViewed: false,
        dialoguesListened: false,
        practiceCompleted: false,
        practiceScore: 0,
        totalProgress: 0
      }));
      saveProgress({
        theoryViewed: false,
        dialoguesListened: false,
        practiceCompleted: false,
        practiceScore: 0,
        totalProgress: 0
      });
    }, [saveProgress])
  };

  // Загружаем прогресс при монтировании
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Обновляем общий прогресс при изменении состояния
  useEffect(() => {
    if (state.progressLoaded) {
      const newTotalProgress = calculateProgress();
      if (newTotalProgress !== state.totalProgress) {
        setState(prev => ({ ...prev, totalProgress: newTotalProgress }));
      }
    }
  }, [state.theoryViewed, state.dialoguesListened, state.practiceCompleted, state.practiceScore, state.progressLoaded, calculateProgress, state.totalProgress]);

  return {
    ...state,
    ...actions,
    calculateProgress
  };
};


















