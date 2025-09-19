import React, { useState, useCallback, useEffect } from 'react';
import { Clock, BookOpen, Play, CheckCircle } from 'lucide-react';
import { Lesson, LessonCategory } from '../../types';
import { LessonProgressService } from '../../services/lessonProgressService';

interface LessonsScreenProps {
  onBack: () => void;
  onStartLesson: (lessonId: string) => void;
  onUpdateLessonProgress?: (lessonId: string, progress: number) => void;
}

export const LessonsScreen: React.FC<LessonsScreenProps> = ({ onBack, onStartLesson, onUpdateLessonProgress }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Состояние для отслеживания прогресса уроков
  const [lessonProgress, setLessonProgress] = useState<{ [lessonId: string]: number }>({});
  const [progressLoaded, setProgressLoaded] = useState(false);


  // Примерные данные для уроков
  const categories: LessonCategory[] = [
    { id: 'all', name: 'Все', description: 'Все уроки', icon: '📚', color: 'bg-gray-500', lessonCount: 13 },
    { id: 'basics', name: 'Основы', description: 'Базовые слова и фразы', icon: '🏠', color: 'bg-blue-500', lessonCount: 5 },
    { id: 'travel', name: 'Путешествия', description: 'Слова для путешествий', icon: '✈️', color: 'bg-green-500', lessonCount: 3 },
    { id: 'food', name: 'Еда', description: 'Еда и напитки', icon: '🍽️', color: 'bg-orange-500', lessonCount: 3 },
    { id: 'work', name: 'Работа', description: 'Рабочие термины', icon: '💼', color: 'bg-purple-500', lessonCount: 2 }
  ];

  const lessons: Lesson[] = [
    {
      id: 'lesson-alphabet',
      title: 'Испанский алфавит',
      description: 'Интерактивный урок по изучению испанского алфавита',
      level: 'beginner',
      duration: 10,
      cardCount: 27,
      completed: false,
      progress: 0,
      category: 'basics',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'intro',
      title: 'Приветствие и знакомство',
      description: 'Основные фразы для знакомства',
      level: 'beginner',
      duration: 15,
      cardCount: 22,
      completed: false,
      progress: 0,
      category: 'basics',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lesson-1-nouns-gender-number',
      title: 'Имя существительное — род',
      description: 'Изучаем род существительных с интерактивными играми',
      level: 'beginner',
      duration: 25,
      cardCount: 0,
      completed: false,
      progress: 0,
      category: 'basics',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const filteredLessons = activeCategory === 'all' 
    ? lessons 
    : lessons.filter(lesson => lesson.category === activeCategory);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return level;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  // Загружаем прогресс из Supabase
  const loadProgressFromSupabase = useCallback(async () => {
    if (progressLoaded) return;
    
    try {
      console.log('📊 Loading all lesson progress from Supabase');
      const allProgress = await LessonProgressService.getAllLessonProgress();
      
      const progressMap: { [lessonId: string]: number } = {};
      allProgress.forEach(progress => {
        progressMap[progress.lesson_id] = progress.total_progress;
      });
      
      setLessonProgress(progressMap);
      setProgressLoaded(true);
      console.log('📊 Loaded progress from Supabase:', progressMap);
    } catch (error) {
      console.error('❌ Error loading progress from Supabase:', error);
      setProgressLoaded(true);
    }
  }, [progressLoaded]);

  // Загружаем прогресс при монтировании
  useEffect(() => {
    loadProgressFromSupabase();
  }, [loadProgressFromSupabase]);

  // Функция для обновления прогресса урока
  const updateLessonProgress = useCallback(async (lessonId: string, newProgress: number) => {
    console.log('📈 LessonsScreen: Updating progress for lesson', lessonId, 'to', newProgress);
    setLessonProgress(prev => ({ ...prev, [lessonId]: newProgress }));
    
    // Сохраняем в Supabase
    try {
      await LessonProgressService.updateLessonProgress(lessonId, { total_progress: newProgress });
      console.log('💾 Progress saved to Supabase');
    } catch (error) {
      console.error('❌ Error updating progress in Supabase:', error);
    }
    
    // Уведомляем родительский компонент
    if (onUpdateLessonProgress) {
      onUpdateLessonProgress(lessonId, newProgress);
    }
  }, [onUpdateLessonProgress]);

  // Слушаем события обновления прогресса
  React.useEffect(() => {
    const handleProgressUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { lessonId, progress } = customEvent.detail;
      console.log('📡 Received progress update event:', { lessonId, progress });
      await updateLessonProgress(lessonId, progress);
    };

    window.addEventListener('lessonProgressUpdated', handleProgressUpdate);
    
    return () => {
      window.removeEventListener('lessonProgressUpdated', handleProgressUpdate);
    };
  }, [updateLessonProgress]);

  // Функция для получения текущего прогресса урока
  const getCurrentProgress = (lessonId: string) => {
    return lessonProgress[lessonId] || 0;
  };

  // Обработчик запуска урока
  const handleStartLesson = useCallback((lessonId: string) => {
    onStartLesson(lessonId);
  }, [onStartLesson]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-blue-600 font-medium"
            >
              ← Назад
            </button>
            <h1 className="font-semibold text-gray-900">Уроки</h1>
            <div className="w-8"></div>
          </div>
        </div>


        {/* Categories */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? `${category.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activeCategory === category.id
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {category.lessonCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Нет уроков</h3>
              <p className="text-gray-600">
                В этой категории пока нет доступных уроков
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white border-2 rounded-xl p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => handleStartLesson(lesson.id)}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                        >
                          {lesson.title}
                        </button>
                        {lesson.completed && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{lesson.description}</p>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(lesson.level)}`}>
                          {getLevelText(lesson.level)}
                        </span>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{lesson.duration} мин</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <BookOpen className="w-3 h-3" />
                          <span className="text-xs">{lesson.cardCount} слов</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Прогресс</span>
                      <span className="text-sm font-medium text-gray-700">{getCurrentProgress(lesson.id)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getCurrentProgress(lesson.id))}`}
                        style={{ width: `${getCurrentProgress(lesson.id)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Main Action Button */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        {getCurrentProgress(lesson.id) === 100 ? (
                          <button
                            onClick={() => handleStartLesson(lesson.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Завершено</span>
                          </button>
                        ) : getCurrentProgress(lesson.id) > 0 ? (
                          <button
                            onClick={() => handleStartLesson(lesson.id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Продолжить</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartLesson(lesson.id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-gray-700 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Начать</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

