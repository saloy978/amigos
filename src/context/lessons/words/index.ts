// Экспорт слов для всех уроков
import { introLessonWords } from './intro-words';
import { lesson1Words } from './lesson1-words';

export { introLessonWords } from './intro-words';
export { lesson1Words } from './lesson1-words';

// Тип для слова урока
export interface LessonWord {
  term: string;
  translation: string;
  english?: string;
}

// Функция для получения слов урока по ID
export const getLessonWords = (lessonId: string): LessonWord[] => {
  switch (lessonId) {
    case 'intro':
      return introLessonWords;
    case 'lesson-1':
    case 'lesson1':
    case 'lesson-1-nouns-gender-number':
      return lesson1Words;
    default:
      console.warn(`No words found for lesson: ${lessonId}`);
      return [];
  }
};

// Функция для получения всех доступных уроков со словами
export const getAvailableLessonsWithWords = (): string[] => {
  return ['intro', 'lesson-1', 'lesson1', 'lesson-1-nouns-gender-number'];
};