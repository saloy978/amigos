import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useSpanishWords } from '../../hooks/useSpanishWords';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { MainMenu } from './MainMenu';
import { BettingScreen } from './BettingScreen';
import { RouletteWheel } from './RouletteWheel';
import { ResultScreen } from './ResultScreen';
import { GameOverScreen } from './GameOverScreen';
import { RecordsScreen } from './RecordsScreen';
import { DictionaryScreen } from './DictionaryScreen';

interface ArticulosRouletteGameProps {
  onNavigateBack: () => void;
}

export const ArticulosRouletteGame: React.FC<ArticulosRouletteGameProps> = ({ onNavigateBack }) => {
  const {
    gameState,
    BET_AMOUNTS,
    startGame,
    selectBet,
    selectArticle,
    setCurrentWord,
    startSpin,
    finishSpin,
    completeSpin,
    updateBalanceOnResult,
    nextRound,
    resetGame,
    backToMenu,
    showRecords,
    showDictionary,
    cancelSpin
  } = useGameState();

  const { getRandomWord } = useSpanishWords();
  const { playChipSound, playSpinSound, playWinSound, playLoseSound, playButtonClick, speakSpanishWord } = useSoundEffects();

  // Получаем новое слово при начале игры
  useEffect(() => {
    if (gameState.gamePhase === 'betting' && !gameState.currentWord) {
      const wordData = getRandomWord(gameState.wordStats);
      if (wordData) {
        setCurrentWord(wordData.word, wordData.article, wordData.translation);
      }
    }
  }, [gameState.gamePhase, gameState.currentWord, getRandomWord, setCurrentWord, gameState.wordStats]);

  // Обработка завершения спина
  useEffect(() => {
    if (gameState.gamePhase === 'spinning' && gameState.isSpinning) {
      // Используем правильный артикль для текущего слова
      const correctArticle = gameState.currentArticle || 'el';
      const isWin = gameState.selectedArticle === correctArticle;
      
      // Воспроизводим звук результата
      if (isWin) {
        playWinSound();
      } else {
        playLoseSound();
      }
      
      // Завершаем спин сразу (без автоматического перехода)
      completeSpin(correctArticle);
    }
  }, [gameState.gamePhase, gameState.isSpinning, gameState.selectedArticle, gameState.currentArticle, completeSpin, playWinSound, playLoseSound]);

  const handleStartGame = () => {
    playButtonClick();
    startGame();
  };

  const handleStartSpin = () => {
    playSpinSound();
    startSpin();
  };

  const handleNextRound = () => {
    playButtonClick();
    // Переходим к следующему раунду (экран ставок)
    nextRound();
  };

  const handleNextWord = () => {
    playButtonClick();
    // Переходим к следующему раунду
    nextRound();
  };

  const handleBackToMenu = () => {
    playButtonClick();
    // Возвращаемся к предыдущему экрану в игре
    if (gameState.gamePhase === 'betting') {
      // Если мы на экране ставок, возвращаемся в главное меню игры
      backToMenu();
    } else if (gameState.gamePhase === 'spinning') {
      // Если мы на экране рулетки, возвращаемся к экрану ставок
      cancelSpin();
    } else if (gameState.gamePhase === 'result') {
      // Если мы на экране результатов, возвращаемся к экрану ставок
      nextRound();
    } else if (gameState.gamePhase === 'records' || gameState.gamePhase === 'dictionary') {
      // Если мы на экранах записей или словаря, возвращаемся в главное меню игры
      backToMenu();
    } else {
      // В остальных случаях возвращаемся в главное меню приложения
      onNavigateBack();
    }
  };

  const handleShowRecords = () => {
    playButtonClick();
    showRecords();
  };

  const handleShowDictionary = () => {
    playButtonClick();
    showDictionary();
  };

  const accuracy = gameState.totalGames > 0 
    ? Math.round((gameState.wins / gameState.totalGames) * 100) 
    : 0;

  const maxBalance = gameState.records.length > 0 
    ? Math.max(...gameState.records) 
    : gameState.balance;

  // Рендер в зависимости от фазы игры
  switch (gameState.gamePhase) {
    case 'menu':
      return (
        <MainMenu
          balance={gameState.balance}
          onStartGame={handleStartGame}
          onShowRecords={handleShowRecords}
          onShowDictionary={handleShowDictionary}
          onNavigateBack={handleBackToMenu}
          playButtonClick={playButtonClick}
        />
      );

    case 'betting':
      return (
        <BettingScreen
          balance={gameState.balance}
          currentWord={gameState.currentWord || ''}
          currentTranslation={gameState.currentTranslation || ''}
          selectedBet={gameState.selectedBet}
          selectedArticle={gameState.selectedArticle}
          betAmounts={BET_AMOUNTS}
          onSelectBet={selectBet}
          onSelectArticle={selectArticle}
          onStartSpin={handleStartSpin}
          onBackToMenu={handleBackToMenu}
          playChipSound={playChipSound}
          playButtonClick={playButtonClick}
          speakSpanishWord={speakSpanishWord}
        />
      );

    case 'spinning':
      return (
        <RouletteWheel
          balance={gameState.balance}
          isSpinning={gameState.isSpinning}
          onSpinComplete={completeSpin}
          onUpdateBalance={updateBalanceOnResult}
          onNextWord={handleNextRound}
          onBackToMenu={handleBackToMenu}
          playSpinSound={playSpinSound}
          playButtonClick={playButtonClick}
          currentWord={gameState.currentWord}
          currentTranslation={gameState.currentTranslation}
          currentArticle={gameState.currentArticle}
          selectedArticle={gameState.selectedArticle}
          spinResult={gameState.spinResult}
          lastResult={gameState.lastResult}
          speakSpanishWord={speakSpanishWord}
        />
      );

    case 'result':
      return (
        <ResultScreen
          isWin={gameState.lastResult === 'win'}
          spinResult={gameState.spinResult || ''}
          selectedArticle={gameState.selectedArticle || ''}
          selectedBet={gameState.selectedBet}
          newBalance={gameState.balance}
          currentWord={gameState.currentWord}
          onNextRound={handleNextWord}
          onBackToMenu={handleBackToMenu}
          playButtonClick={playButtonClick}
          speakSpanishWord={speakSpanishWord}
        />
      );

    case 'gameOver':
      return (
        <GameOverScreen
          finalBalance={gameState.balance}
          totalGames={gameState.totalGames}
          wins={gameState.wins}
          losses={gameState.losses}
          accuracy={accuracy}
          maxBalance={maxBalance}
          onPlayAgain={resetGame}
          onBackToMenu={handleBackToMenu}
          playButtonClick={playButtonClick}
        />
      );

    case 'records':
      return (
        <RecordsScreen
          records={gameState.records}
          totalGames={gameState.totalGames}
          wins={gameState.wins}
          losses={gameState.losses}
          accuracy={accuracy}
          onBackToMenu={handleBackToMenu}
          playButtonClick={playButtonClick}
        />
      );

    case 'dictionary':
      return (
        <DictionaryScreen
          wrongWords={gameState.wrongWords}
          onBackToMenu={handleBackToMenu}
          playButtonClick={playButtonClick}
        />
      );

    default:
      return (
        <MainMenu
          balance={gameState.balance}
          onStartGame={handleStartGame}
          onShowRecords={handleShowRecords}
          onShowDictionary={handleShowDictionary}
          onNavigateBack={handleBackToMenu}
          playButtonClick={playButtonClick}
        />
      );
  }
};
