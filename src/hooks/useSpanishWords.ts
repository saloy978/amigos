import { useState, useEffect, useCallback } from 'react';
import spanishWordsData from '../data/spanishWords.json';

export interface SpanishWord {
  word: string;
  article: string;
  translation: string;
}

export const useSpanishWords = () => {
  const [words, setWords] = useState<SpanishWord[]>([]);
  
  useEffect(() => {
    setWords(spanishWordsData.words);
  }, []);

  const getRandomWord = useCallback((wordStats: { [word: string]: number } = {}): SpanishWord | null => {
    if (words.length === 0) return null;

    // Фильтруем слова, которые были правильно отвечены 5 или более раз
    let availableWords = words.filter(word => (wordStats[word.word] || 0) < 5);

    // Если все слова выучены, сбрасываем фильтр и используем все слова
    if (availableWords.length === 0) {
      availableWords = words;
    }
    
    // Выбираем случайное слово из доступных
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];

    return selectedWord;
  }, [words]);

  const getWordByText = useCallback((wordText: string): SpanishWord | null => {
    return words.find(word => word.word === wordText) || null;
  }, [words]);

  return {
    words,
    getRandomWord,
    getWordByText
  };
};
