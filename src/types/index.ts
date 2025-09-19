export interface LanguagePair {
  id: string;
  knownLanguage: string;
  learningLanguage: string;
  knownLanguageCode: string;
  learningLanguageCode: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface LanguagePairData {
  known_language: string;
  learning_language: string;
  known_language_code: string;
  learning_language_code: string;
}
// Global card content (shared across all users)
export interface Card {
  id: number;
  languagePairId: string;
  term: string;
  translation: string;
  imageUrl?: string;
  imagePath?: string;
  imageMetadata?: Record<string, any>;
  createdAt: Date;
}

// User's personal progress for a card
export interface UserCard {
  userId: string;
  cardId: number;
  state: CardState;
  progress: number;
  reviewCount: number;
  successfulReviews: number;
  direction: ReviewDirection;
  easeFactor: number;
  intervalDays: number;
  dueAt: Date;
  lastReviewedAt?: Date;
  customImagePath?: string;
  customImageMetadata?: Record<string, any>;
  lessonId?: string;
  lessonOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Combined view for user cards with content
export interface UserCardWithContent extends UserCard {
  languagePairId: string;
  term: string;
  translation: string;
  imageUrl?: string;
  imagePath?: string;
  imageMetadata?: Record<string, any>;
  english?: string;
}

// Review history
export interface Review {
  id: number;
  userId: string;
  cardId: number;
  reviewedAt: Date;
  rating: number; // 1-5 scale
  prevInterval?: number;
  nextInterval?: number;
  prevEf?: number;
  nextEf?: number;
}

// Legacy Card interface for backward compatibility (will be removed)
export interface LegacyCard {
  id: string;
  term: string;
  translation: string;
  english?: string;
  imageUrl?: string;
  progress: number;
  state: CardState;
  dueAt: Date;
  reviewCount: number;
  successfulReviews: number;
  direction: ReviewDirection;
  languagePairId: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
  easeFactor: number;
  intervalDays: number;
  lessonId?: string;
  lessonOrder?: number;
}

export enum CardState {
  LEARN = 'LEARN',
  REVIEW = 'REVIEW',
  SUSPENDED = 'SUSPENDED'
}

export enum ReviewDirection {
  KNOWN_TO_LEARNING = 'K_TO_L',
  LEARNING_TO_KNOWN = 'L_TO_K'
}

export enum DisplayMode {
  DEMONSTRATION = 'DEMONSTRATION',
  WORD = 'WORD',
  TRANSLATION = 'TRANSLATION',
  TRANSLATION_TO_WORD = 'TRANSLATION_TO_WORD',
  LISTENING_1 = 'LISTENING_1', // Аудирование-1: произносится слово, по тапу показывается картинка, слово и перевод
  LISTENING_2 = 'LISTENING_2'  // Аудирование-2: произносится слово, окно для ввода испанского слова
}

export interface ReviewResult {
  correct: boolean;
  timeSpent: number;
}

export interface SessionStats {
  cardsReviewed: number;
  correctAnswers: number;
  timeSpent: number;
  newCards: number;
  reviewCards: number;
}

export interface UserStats {
  streak: number;
  totalCards: number;
  learnedCards: number;
  masteredCards: number;
  reviewsDue: number;
  lastSessionDate?: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // в минутах
  cardCount: number;
  completed: boolean;
  progress: number; // процент выполнения
  category: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonContent {
  id: string;
  title: string;
  theory: string;
  dialogues: Array<{
    es: string[];
    ru: string[];
  }>;
  practice: Array<{
    task: string;
    items: Array<{
      ru: string;
      es: string;
    }>;
  }>;
  games: string[];
  tips: string;
}

export interface LessonCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessonCount: number;
}

// Типы для игр урока
export interface GameItem {
  term: string;
  answer: string;
  explanation?: string;
}

export interface PluralGameItem {
  singular: string;
  plural: string;
  rule: string;
}

export interface SortGameItem {
  term: string;
  gender: 'm' | 'f' | 'x';
}

export interface ErrorGameItem {
  wrong: string;
  right: string;
  explanation: string;
}

export interface GameScore {
  correct: number;
  total: number;
  percentage: number;
}

export interface LessonGameState {
  currentGame: number;
  scores: GameScore[];
  completed: boolean;
}