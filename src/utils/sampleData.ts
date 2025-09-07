import { Card, LanguagePair, CardState, ReviewDirection } from '../types';

export const sampleLanguagePair: LanguagePair = {
  id: 'ru-en',
  knownLanguage: 'Русский',
  learningLanguage: 'English',
  knownLanguageCode: 'ru',
  learningLanguageCode: 'en'
};

export const sampleCards: Card[] = [
  {
    id: 'card-1',
    term: 'яблоко',
    translation: 'apple',
    imageUrl: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
    progress: 15,
    state: CardState.LEARN,
    dueAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (overdue)
    reviewCount: 2,
    successfulReviews: 1,
    direction: ReviewDirection.KNOWN_TO_LEARNING,
    languagePairId: 'ru-en',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    easeFactor: 2.5,
    intervalDays: 0
  },
  {
    id: 'card-2',
    term: 'собака',
    translation: 'dog',
    imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
    progress: 45,
    state: CardState.LEARN,
    dueAt: new Date(Date.now() + 2 * 60 * 1000), // in 2 minutes
    reviewCount: 4,
    successfulReviews: 3,
    direction: ReviewDirection.KNOWN_TO_LEARNING,
    languagePairId: 'ru-en',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    easeFactor: 2.5,
    intervalDays: 0
  },
  {
    id: 'card-3',
    term: 'дом',
    translation: 'house',
    imageUrl: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
    progress: 75,
    state: CardState.KNOW,
    dueAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago (overdue)
    reviewCount: 8,
    successfulReviews: 6,
    direction: ReviewDirection.KNOWN_TO_LEARNING,
    languagePairId: 'ru-en',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000),
    easeFactor: 2.5,
    intervalDays: 1
  },
  {
    id: 'card-4',
    term: 'вода',
    translation: 'water',
    progress: 95,
    state: CardState.MASTERED,
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    reviewCount: 12,
    successfulReviews: 11,
    direction: ReviewDirection.KNOWN_TO_LEARNING,
    languagePairId: 'ru-en',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    easeFactor: 2.8,
    intervalDays: 7
  },
  {
    id: 'card-5',
    term: 'книга',
    translation: 'book',
    imageUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
    progress: 30,
    state: CardState.LEARN,
    dueAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (overdue)
    reviewCount: 3,
    successfulReviews: 2,
    direction: ReviewDirection.KNOWN_TO_LEARNING,
    languagePairId: 'ru-en',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000),
    easeFactor: 2.4,
    intervalDays: 0
  }
];