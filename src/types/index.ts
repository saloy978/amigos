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
export interface Card {
  id: string;
  term: string;
  translation: string;
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
}

export enum CardState {
  LEARN = 'LEARN',
  KNOW = 'KNOW', 
  MASTERED = 'MASTERED'
}

export enum ReviewDirection {
  KNOWN_TO_LEARNING = 'K_TO_L',
  LEARNING_TO_KNOWN = 'L_TO_K'
}

export enum DisplayMode {
  DEMONSTRATION = 'DEMONSTRATION',
  WORD = 'WORD',
  TRANSLATION = 'TRANSLATION', 
  INPUT = 'INPUT'
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