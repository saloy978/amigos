import { useState, useEffect, useCallback } from 'react';

export interface GameState {
  balance: number;
  currentWord: string | null;
  currentArticle: string | null;
  currentTranslation: string | null;
  selectedBet: number;
  selectedArticle: string | null;
  gamePhase: 'menu' | 'betting' | 'spinning' | 'result' | 'gameOver' | 'records' | 'dictionary';
  isSpinning: boolean;
  spinResult: string | null;
  lastResult: 'win' | 'lose' | null;
  totalGames: number;
  wins: number;
  losses: number;
  wrongWords: string[];
  records: number[];
  wordStats: { [word: string]: number };
}

const INITIAL_BALANCE = 200;
const ALL_IN_BET_VALUE = -1; // Значение для ставки "Por todo" (весь баланс)
const BET_AMOUNTS = [5, 10, 20, 50, 100, ALL_IN_BET_VALUE];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    currentWord: null,
    currentArticle: null,
    currentTranslation: null,
    selectedBet: 0,
    selectedArticle: null,
    gamePhase: 'menu',
    isSpinning: false,
    spinResult: null,
    lastResult: null,
    totalGames: 0,
    wins: 0,
    losses: 0,
    wrongWords: [],
    records: [],
    wordStats: {}
  });

  // Загрузка состояния из localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('articulos-roulette-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(prev => ({
          ...prev,
          ...parsed,
          gamePhase: 'menu', // Всегда начинаем с меню
          isSpinning: false,
          spinResult: null,
          lastResult: null
        }));
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Сохранение состояния в localStorage
  useEffect(() => {
    const stateToSave = {
      balance: gameState.balance,
      totalGames: gameState.totalGames,
      wins: gameState.wins,
      losses: gameState.losses,
      wrongWords: gameState.wrongWords,
      records: gameState.records,
      wordStats: gameState.wordStats
    };
    localStorage.setItem('articulos-roulette-state', JSON.stringify(stateToSave));
  }, [gameState.balance, gameState.totalGames, gameState.wins, gameState.losses, gameState.wrongWords, gameState.records, gameState.wordStats]);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'betting',
      selectedBet: 0,
      selectedArticle: null,
      currentWord: null,
      currentArticle: null,
      currentTranslation: null
    }));
  }, []);

  const selectBet = useCallback((amount: number) => {
    if (amount > gameState.balance && amount !== ALL_IN_BET_VALUE) return; // Учитываем "Por todo"

    const betAmount = amount === ALL_IN_BET_VALUE ? gameState.balance : amount;
    
    setGameState(prev => ({
      ...prev,
      selectedBet: betAmount
    }));
  }, [gameState.balance]);

  const selectArticle = useCallback((article: string) => {
    setGameState(prev => ({
      ...prev,
      selectedArticle: article
    }));
  }, []);

  const setCurrentWord = useCallback((word: string, article: string, translation: string) => {
    setGameState(prev => ({
      ...prev,
      currentWord: word,
      currentArticle: article,
      currentTranslation: translation
    }));
  }, []);

  const startSpin = useCallback(() => {
    if (!gameState.selectedBet || !gameState.selectedArticle || !gameState.currentWord) return;

    setGameState(prev => ({
      ...prev,
      gamePhase: 'spinning',
      isSpinning: true,
      spinResult: null
    }));
  }, [gameState.selectedBet, gameState.selectedArticle, gameState.currentWord]);

  const finishSpin = useCallback((result: string) => {
    const isWin = result === gameState.selectedArticle;
    const newBalance = isWin 
      ? gameState.balance + gameState.selectedBet 
      : gameState.balance - gameState.selectedBet;

    const newWrongWords = isWin 
      ? gameState.wrongWords 
      : [...gameState.wrongWords, gameState.currentWord!];

    const newRecords = [...gameState.records];
    if (newBalance > Math.max(...newRecords, 0)) {
      newRecords.push(newBalance);
    }

    setGameState(prev => ({
      ...prev,
      gamePhase: 'result',
      isSpinning: false,
      spinResult: result,
      lastResult: isWin ? 'win' : 'lose',
      balance: newBalance,
      totalGames: prev.totalGames + 1,
      wins: isWin ? prev.wins + 1 : prev.wins,
      losses: isWin ? prev.losses : prev.losses + 1,
      wrongWords: newWrongWords,
      records: newRecords
    }));
  }, [gameState.selectedArticle, gameState.selectedBet, gameState.balance, gameState.currentWord, gameState.wrongWords, gameState.records]);

  const completeSpin = useCallback((result: string) => {
    const isWin = result === gameState.selectedArticle;

    setGameState(prev => ({
      ...prev,
      // Остаемся в фазе 'spinning', но обновляем данные
      isSpinning: false,
      spinResult: result,
      lastResult: isWin ? 'win' : 'lose'
    }));
  }, [gameState.selectedArticle]);

  const updateBalanceOnResult = useCallback(() => {
    if (!gameState.spinResult || !gameState.selectedArticle) return;

    const isWin = gameState.spinResult === gameState.selectedArticle;
    const newBalance = isWin 
      ? gameState.balance + gameState.selectedBet 
      : gameState.balance - gameState.selectedBet;

    const newWrongWords = isWin 
      ? gameState.wrongWords 
      : [...gameState.wrongWords, gameState.currentWord!];

    const newRecords = [...gameState.records];
    if (newBalance > Math.max(...newRecords, 0)) {
      newRecords.push(newBalance);
    }

    // Обновляем статистику слова, если ответ правильный
    const newWordStats = { ...gameState.wordStats };
    if (isWin && gameState.currentWord) {
      newWordStats[gameState.currentWord] = (newWordStats[gameState.currentWord] || 0) + 1;
    }
    
    setGameState(prev => ({
      ...prev,
      balance: newBalance,
      totalGames: prev.totalGames + 1,
      wins: isWin ? prev.wins + 1 : prev.wins,
      losses: isWin ? prev.losses : prev.losses + 1,
      wrongWords: newWrongWords,
      records: newRecords,
      wordStats: newWordStats
    }));
  }, [gameState.spinResult, gameState.selectedArticle, gameState.selectedBet, gameState.balance, gameState.currentWord, gameState.wrongWords, gameState.records, gameState.wordStats]);

  const nextRound = useCallback(() => {
    if (gameState.balance <= 0) {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'gameOver'
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'betting',
        selectedBet: 0,
        selectedArticle: null,
        currentWord: null,
        currentArticle: null,
        currentTranslation: null,
        spinResult: null,
        lastResult: null
      }));
    }
  }, [gameState.balance]);

  const resetGame = useCallback(() => {
    setGameState({
      balance: INITIAL_BALANCE,
      currentWord: null,
      currentArticle: null,
      currentTranslation: null,
      selectedBet: 0,
      selectedArticle: null,
      gamePhase: 'menu',
      isSpinning: false,
      spinResult: null,
      lastResult: null,
      totalGames: 0,
      wins: 0,
      losses: 0,
      wrongWords: [],
      records: [],
      wordStats: {}
    });
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'menu',
      selectedBet: 0,
      selectedArticle: null,
      currentWord: null,
      currentArticle: null,
      currentTranslation: null,
      spinResult: null,
      lastResult: null,
      isSpinning: false
    }));
  }, []);

  const showRecords = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'records'
    }));
  }, []);

  const showDictionary = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'dictionary'
    }));
  }, []);

  const cancelSpin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'betting',
      isSpinning: false,
      selectedBet: 0,
      selectedArticle: null
    }));
  }, []);

  return {
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
  };
};
