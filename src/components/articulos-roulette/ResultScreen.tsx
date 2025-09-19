import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './ResultScreen.module.css';
import '../../styles/global.css';

interface ResultScreenProps {
  isWin: boolean;
  spinResult: string;
  selectedArticle: string;
  selectedBet: number;
  newBalance: number;
  currentWord: string | null;
  onNextRound: () => void;
  onBackToMenu: () => void;
  playButtonClick: () => void;
  speakSpanishWord: (word: string) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  isWin,
  spinResult,
  selectedArticle,
  selectedBet,
  newBalance,
  currentWord,
  onNextRound,
  onBackToMenu,
  playButtonClick,
  speakSpanishWord
}) => {
  const [hasSpoken, setHasSpoken] = useState(false);

  // Сбрасываем состояние озвучивания при изменении слова
  useEffect(() => {
    setHasSpoken(false);
  }, [currentWord]);

  // Озвучиваем правильное слово с артиклем при появлении экрана результатов
  useEffect(() => {
    console.log('ResultScreen useEffect:', { currentWord, spinResult, hasSpoken });
    if (currentWord && spinResult && !hasSpoken && speakSpanishWord) {
      const correctWord = `${spinResult} ${currentWord}`;
      console.log('Speaking word:', correctWord);
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        console.log('About to call speakSpanishWord with:', correctWord);
        speakSpanishWord(correctWord);
        setHasSpoken(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('Conditions not met for speaking:', { 
        hasCurrentWord: !!currentWord, 
        hasSpinResult: !!spinResult, 
        hasNotSpoken: !hasSpoken, 
        hasSpeakFunction: !!speakSpanishWord 
      });
    }
  }, [currentWord, spinResult, speakSpanishWord, hasSpoken]);

  return (
    <div className="app-bg">
      <div className={styles.container}>
        {/* Кнопка "Назад" */}
        <div className="flex justify-start">
          <button
            onClick={() => {
              playButtonClick();
              onBackToMenu();
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-colors"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Результат */}
        <div className={styles.result}>
          <div className={`${styles.resultIcon} ${isWin ? styles.win : styles.lose}`}>
            {isWin ? '🎉' : '😞'}
          </div>
          
          <h2 className={`${styles.resultTitle} ${isWin ? styles.winText : styles.loseText}`}>
            {isWin ? '¡GANASTE!' : '¡PERDISTE!'}
          </h2>
          
          <div className={styles.resultDetails}>
            <p>Tu apuesta: <strong>{selectedArticle.toUpperCase()}</strong></p>
            <p>Resultado: <strong>{spinResult.toUpperCase()}</strong></p>
            <p>Apuesta: <strong>{selectedBet} créditos</strong></p>
            <p>Nuevo balance: <strong>{newBalance} créditos</strong></p>
          </div>
        </div>

        {/* Кнопки */}
        <div className={styles.actions}>
          <button
            className={styles.nextButton}
            onClick={() => {
              playButtonClick();
              onNextRound();
            }}
          >
            Siguiente palabra
          </button>
        </div>
      </div>
    </div>
  );
};
