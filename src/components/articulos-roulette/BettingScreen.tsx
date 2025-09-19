import React, { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import styles from '../../pages/BettingScreen.module.css';
import '../../styles/global.css';

interface BettingScreenProps {
  balance: number;
  currentWord: string;
  currentTranslation?: string;
  selectedBet: number;
  selectedArticle?: string | null;
  betAmounts: number[];
  onSelectBet: (amount: number) => void;
  onSelectArticle: (article: string) => void;
  onStartSpin: () => void;
  onBackToMenu: () => void;
  playChipSound: () => void;
  playButtonClick: () => void;
  speakSpanishWord: (word: string) => void;
}

export const BettingScreen: React.FC<BettingScreenProps> = ({
  balance,
  currentWord,
  selectedBet,
  selectedArticle,
  betAmounts,
  onSelectBet,
  onSelectArticle,
  onStartSpin,
  onBackToMenu,
  playChipSound,
  playButtonClick,
  speakSpanishWord
}) => {
  const [betIndex, setBetIndex] = useState(0);

  // Озвучиваем слово при появлении на экране
  useEffect(() => {
    if (currentWord) {
      const timer = setTimeout(() => speakSpanishWord(currentWord), 500);
      return () => clearTimeout(timer);
    }
  }, [currentWord, speakSpanishWord]);

  // Автоматически запускаем спин после выбора артикля
  useEffect(() => {
    if (selectedArticle && selectedBet > 0) {
      const timer = setTimeout(() => onStartSpin(), 50);
      return () => clearTimeout(timer);
    }
  }, [selectedArticle, selectedBet, onStartSpin]);

  // Обновляем ставку при изменении индекса
  useEffect(() => {
    const newBet = betAmounts[betIndex];
    if (newBet !== -1 && newBet <= balance) {
      onSelectBet(newBet);
    } else if (newBet === -1) {
      // "Por todo" всегда доступен, если есть баланс
      if (balance > 0) onSelectBet(balance);
    } else {
      // Если ставка больше баланса, ищем ближайшую доступную
      const closestBetIndex = betAmounts.slice(0, -1).reverse().findIndex(b => b <= balance);
      if (closestBetIndex !== -1) {
        setBetIndex(betAmounts.length - 2 - closestBetIndex);
      } else {
        onSelectBet(0);
      }
    }
  }, [betIndex, balance, betAmounts, onSelectBet]);

  const handleBetChange = (direction: 'increase' | 'decrease') => {
    playChipSound();
    let newIndex = betIndex;
    if (direction === 'increase') {
      newIndex = (betIndex + 1) % betAmounts.length;
    } else {
      newIndex = (betIndex - 1 + betAmounts.length) % betAmounts.length;
    }
    
    // Пропускаем недоступные ставки
    const nextBet = betAmounts[newIndex];
    if (nextBet > balance && nextBet !== -1) {
      // Ищем следующую доступную ставку вверх
      if (direction === 'increase') {
        const availableIndex = betAmounts.findIndex((b, i) => i > newIndex && (b <= balance || b === -1));
        newIndex = availableIndex !== -1 ? availableIndex : betAmounts.length - 1;
      } else {
        // Ищем следующую доступную ставку вниз
        const availableIndex = betAmounts.slice(0, newIndex).reverse().findIndex(b => b <= balance);
        newIndex = availableIndex !== -1 ? (newIndex - 1 - availableIndex) : 0;
      }
    }
    setBetIndex(newIndex);
  };

  const handleAllIn = () => {
    playChipSound();
    setBetIndex(betAmounts.length - 1);
    onSelectBet(balance);
  };

  const handleArticleSelect = (article: string) => {
    if (selectedBet > 0) {
      playButtonClick();
      onSelectArticle(article);
    }
  };

  const currentBetValue = betAmounts[betIndex] === -1 ? 'TODO' : betAmounts[betIndex];
  const isAllInSelected = betAmounts[betIndex] === -1;

  return (
    <div className="app-bg">
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className="flex justify-start">
            <button
              onClick={() => {
                playButtonClick();
                onBackToMenu();
              }}
              className={styles.backButton}
              title="Назад"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <div className={styles.credits}>{balance} CRÉDITOS</div>
          <div className={styles.word}>{currentWord}</div>

          <div className={styles.bettingContainer}>
            <div className={styles.betSelector}>
              <button onClick={() => handleBetChange('decrease')} className={styles.betControlButton}>
                <Minus size={24} />
              </button>
              <div className={styles.betDisplay}>
                <span>{currentBetValue}</span>
              </div>
              <button onClick={() => handleBetChange('increase')} className={styles.betControlButton}>
                <Plus size={24} />
              </button>
            </div>
            <button 
              onClick={handleAllIn} 
              className={`${styles.allInButton} ${isAllInSelected ? styles.allInSelected : ''}`}
            >
              POR TODO
            </button>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.bigBtn} ${styles.el} ${!selectedBet ? styles.disabled : ''}`}
              onClick={() => handleArticleSelect('el')}
              disabled={!selectedBet}
              aria-label="Elegir EL"
            >
              <span>EL</span>
            </button>
            <button
              className={`${styles.bigBtn} ${styles.la} ${!selectedBet ? styles.disabled : ''}`}
              onClick={() => handleArticleSelect('la')}
              disabled={!selectedBet}
              aria-label="Elegir LA"
            >
              <span>LA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
