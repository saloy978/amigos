import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, RotateCcw, Trophy, Clock, Target, X, ArrowLeft, Home } from 'lucide-react';

interface GameStats {
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  averageReactionTime: number;
  combo: number;
  maxCombo: number;
}

interface GameSettings {
  level: number;
  timeLimit: number;
  letterCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const SPANISH_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const LETTER_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 
  'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

const LETTER_SOUNDS: { [key: string]: string } = {
  'A': 'A', 'B': 'Be', 'C': 'Ce', 'D': 'De', 'E': 'E', 'F': 'Efe', 'G': 'Ge',
  'H': 'Hache', 'I': 'I', 'J': 'Jota', 'K': 'Ka', 'L': 'Ele', 'M': 'Eme',
  'N': 'Ene', 'Ñ': 'Eñe', 'O': 'O', 'P': 'Pe', 'Q': 'Cu', 'R': 'Erre',
  'S': 'Ese', 'T': 'Te', 'U': 'U', 'V': 'Uve', 'W': 'Doble uve', 'X': 'Equis',
  'Y': 'I griega', 'Z': 'Zeta'
};

interface SoundHuntGameProps {
  onNavigateToHome: () => void;
  onNavigateToNumbersHunt?: () => void;
  onNavigateToArticulosRoulette?: () => void;
}

export const SoundHuntGame: React.FC<SoundHuntGameProps> = ({ onNavigateToHome, onNavigateToNumbersHunt, onNavigateToArticulosRoulette }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'stats'>('menu');
  const [currentLetter, setCurrentLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    averageReactionTime: 0,
    combo: 0,
    maxCombo: 0
  });
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    level: 1,
    timeLimit: 10,
    letterCount: 4,
    difficulty: 'easy'
  });
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Инициализация игры
  const startGame = useCallback(() => {
    setGameState('playing');
    setGameStats(prev => ({ ...prev, score: 0, correctAnswers: 0, totalAnswers: 0, combo: 0 }));
    setReactionTimes([]);
    setGameStartTime(Date.now());
    generateNewRound();
  }, []);

  // Завершение игры
  const endGame = useCallback(() => {
    setGameState('gameOver');
    // const totalTime = Date.now() - gameStartTime; // Пока не используется
    const averageReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length 
      : 0;
    
    setGameStats(prev => ({
      ...prev,
      averageReactionTime
    }));
  }, [gameStartTime, reactionTimes]);

  // Генерация нового раунда
  const generateNewRound = useCallback(() => {
    const targetLetter = SPANISH_LETTERS[Math.floor(Math.random() * SPANISH_LETTERS.length)];
    setCurrentLetter(targetLetter);
    
    // Генерируем буквы для выбора
    const letters = [targetLetter];
    while (letters.length < gameSettings.letterCount) {
      const randomLetter = SPANISH_LETTERS[Math.floor(Math.random() * SPANISH_LETTERS.length)];
      if (!letters.includes(randomLetter)) {
        letters.push(randomLetter);
      }
    }
    
    // Перемешиваем буквы
    const shuffledLetters = letters.sort(() => Math.random() - 0.5);
    setAvailableLetters(shuffledLetters);
    setSelectedLetter(null);
    setTimeLeft(gameSettings.timeLimit);
    setReactionStartTime(Date.now());
    setShowFeedback(null);
    
    // Воспроизводим звук буквы
    playLetterSound(targetLetter);
  }, [gameSettings.letterCount, gameSettings.timeLimit]);

  // Воспроизведение звука буквы
  const playLetterSound = useCallback((letter: string) => {
    const soundText = LETTER_SOUNDS[letter] || letter;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(soundText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Обработка выбора буквы
  const handleLetterSelect = useCallback((letter: string) => {
    if (selectedLetter || gameState !== 'playing') return;
    
    setSelectedLetter(letter);
    const reactionTime = Date.now() - reactionStartTime;
    const isCorrect = letter === currentLetter;
    
    if (isCorrect) {
      setShowFeedback('correct');
      setGameStats(prev => ({
        ...prev,
        score: prev.score + Math.max(1, Math.floor((gameSettings.timeLimit - reactionTime / 1000) * 10)),
        correctAnswers: prev.correctAnswers + 1,
        totalAnswers: prev.totalAnswers + 1,
        combo: prev.combo + 1,
        maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
      }));
      setReactionTimes(prev => [...prev, reactionTime]);
      
      // Приятный звук при правильном ответе
      playSuccessSound();
    } else {
      setShowFeedback('incorrect');
      setGameStats(prev => ({
        ...prev,
        totalAnswers: prev.totalAnswers + 1,
        combo: 0
      }));
      
      // Штраф за неправильный ответ
      setTimeLeft(prev => Math.max(0, prev - 2));
      playErrorSound();
    }
    
    // Переход к следующему раунду через короткую задержку
    setTimeout(() => {
      if (gameState === 'playing') {
        generateNewRound();
      }
    }, 1500);
  }, [selectedLetter, gameState, currentLetter, reactionStartTime, gameSettings.timeLimit, generateNewRound]);

  // Воспроизведение звуков
  const playSuccessSound = useCallback(() => {
    // Простой звук успеха через Web Audio API
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, []);

  const playErrorSound = useCallback(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, []);

  // Таймер
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 0.1);
      }, 100);
    } else if (timeLeft <= 0 && gameState === 'playing') {
      // Время вышло - завершаем игру
      setGameStats(prev => ({
        ...prev,
        totalAnswers: prev.totalAnswers + 1,
        combo: 0
      }));
      
      // Завершаем игру через короткую задержку
      setTimeout(() => {
        endGame();
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState, timeLeft, generateNewRound, endGame]);

  // Обновление сложности
  useEffect(() => {
    const newLevel = Math.floor(gameStats.correctAnswers / 5) + 1;
    if (newLevel !== gameSettings.level) {
      setGameSettings(prev => ({
        ...prev,
        level: newLevel,
        letterCount: Math.min(9, 3 + Math.floor(newLevel / 2)),
        timeLimit: Math.max(5, 10 - Math.floor(newLevel / 3)),
        difficulty: newLevel <= 3 ? 'easy' : newLevel <= 6 ? 'medium' : 'hard'
      }));
    }
  }, [gameStats.correctAnswers, gameSettings.level]);

  // Повтор уровня
  const restartLevel = useCallback(() => {
    setGameState('playing');
    setGameStats(prev => ({ ...prev, combo: 0 }));
    generateNewRound();
  }, [generateNewRound]);

  // Показать статистику
  const showStats = useCallback(() => {
    setGameState('stats');
  }, []);

  // Возврат в меню
  const backToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex flex-col p-4">
          {/* Кнопка "На главную" */}
          <div className="flex justify-start pt-4 pb-2">
            <button
              onClick={onNavigateToHome}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-colors"
              title="На главную"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {/* Основной контент */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full text-center">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Игры</h1>
                <p className="text-sm sm:text-base text-gray-600">Выбери игру для изучения</p>
              </div>
            
            {/* Блоки игр */}
            <div className="space-y-4">
              {/* Блок "Звуковая охота: буквы" */}
              <div 
                onClick={startGame}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔤</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Звуковая охота: буквы</h3>
                      <p className="text-blue-100 text-sm">Изучай испанский алфавит</p>
                    </div>
                  </div>
                  <div className="text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Блок "Звуковая охота: числа" */}
              {onNavigateToNumbersHunt && (
                <div 
                  onClick={onNavigateToNumbersHunt}
                  className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 cursor-pointer hover:from-green-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔢</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Звуковая охота: числа</h3>
                        <p className="text-green-100 text-sm">Изучай испанские числа</p>
                      </div>
                    </div>
                    <div className="text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Блок "Artículos Roulette" */}
              {onNavigateToArticulosRoulette && (
                <div 
                  onClick={onNavigateToArticulosRoulette}
                  className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 cursor-pointer hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🎰</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Artículos Roulette</h3>
                        <p className="text-purple-100 text-sm">Изучай испанские артикли</p>
                      </div>
                    </div>
                    <div className="text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Дополнительные кнопки */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={showStats}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  📊 Статистика
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'stats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full">
            <div className="text-center mb-6">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Статистика</h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700">Очки:</span>
                <span className="font-bold text-blue-600">{gameStats.score}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700">Правильных ответов:</span>
                <span className="font-bold text-green-600">
                  {gameStats.correctAnswers}/{gameStats.totalAnswers}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700">Точность:</span>
                <span className="font-bold text-purple-600">
                  {gameStats.totalAnswers > 0 
                    ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100)
                    : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700">Максимальное комбо:</span>
                <span className="font-bold text-orange-600">{gameStats.maxCombo}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-xl">
                <span className="text-sm sm:text-base text-gray-700">Средняя скорость:</span>
                <span className="font-bold text-teal-600">
                  {Math.round(gameStats.averageReactionTime)}мс
                </span>
              </div>
            </div>
            
            <button
              onClick={backToMenu}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-2 sm:py-3 px-6 rounded-2xl font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
            >
              ← Назад в меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full text-center">
            <div className="mb-6">
              <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Игра завершена!</h2>
              <p className="text-sm sm:text-base text-gray-600">Отличная работа!</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{gameStats.score}</div>
              <div className="text-sm sm:text-base text-gray-600">Очков набрано</div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 sm:py-3 px-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all text-sm sm:text-base"
              >
                🎮 Играть снова
              </button>
              
              <button
                onClick={showStats}
                className="w-full bg-gray-100 text-gray-700 py-2 sm:py-3 px-6 rounded-2xl font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                📊 Посмотреть статистику
              </button>
              
              <button
                onClick={backToMenu}
                className="w-full bg-gray-100 text-gray-700 py-2 sm:py-3 px-6 rounded-2xl font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                ← Главное меню
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
        {/* Верхняя часть */}
        <div className="px-4 pb-6 pt-1.5">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={backToMenu}
                className="bg-gray-500 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-colors"
                title="Назад"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <button
                onClick={() => playLetterSound(currentLetter)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full transition-colors"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <button
                onClick={endGame}
                className="bg-red-500 hover:bg-red-600 text-white p-2 sm:p-3 rounded-full transition-colors"
                title="Завершить игру"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray={`${(timeLeft / gameSettings.timeLimit) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {Math.ceil(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <span className="text-base sm:text-lg font-bold text-gray-800">{gameStats.score}</span>
              </div>
            </div>
          </div>

          {/* Центральная часть - сетка букв */}
          <div className="flex justify-center mb-8 px-4">
            <div className={`grid gap-3 ${
              gameSettings.letterCount <= 4 ? 'grid-cols-2' : 
              gameSettings.letterCount <= 6 ? 'grid-cols-3' : 'grid-cols-3'
            }`}>
              {availableLetters.map((letter, index) => {
                const isSelected = selectedLetter === letter;
                const isCorrect = letter === currentLetter && isSelected;
                const isIncorrect = letter !== currentLetter && isSelected;
                
                return (
                  <button
                    key={`${letter}-${index}`}
                    onClick={() => handleLetterSelect(letter)}
                    disabled={selectedLetter !== null}
                    className={`
                      w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-white font-bold text-xl sm:text-2xl
                      transition-all duration-300 transform hover:scale-105
                      ${LETTER_COLORS[index % LETTER_COLORS.length]}
                      ${isSelected ? 'scale-95' : 'hover:scale-105'}
                      ${isCorrect ? 'ring-4 ring-green-400 bg-green-500' : ''}
                      ${isIncorrect ? 'ring-4 ring-red-400 bg-red-500' : ''}
                      ${selectedLetter && !isSelected ? 'opacity-50' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Обратная связь */}
          {showFeedback && (
            <div className="text-center mb-6 px-4">
              <div className={`
                inline-block px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-base sm:text-lg
                ${showFeedback === 'correct' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }
              `}>
                {showFeedback === 'correct' ? '✅ Правильно!' : '❌ Неправильно'}
              </div>
            </div>
          )}

          {/* Нижняя часть */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-blue-500 text-white px-3 py-2 sm:px-4 rounded-full">
                <span className="text-xs sm:text-sm font-medium">
                  Уровень {gameSettings.level} • {gameStats.correctAnswers}/10
                </span>
              </div>
              
              {gameStats.combo > 0 && (
                <div className="bg-orange-500 text-white px-3 py-2 sm:px-4 rounded-full">
                  <span className="text-xs sm:text-sm font-medium">
                    🔥 Комбо x{gameStats.combo}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={restartLevel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 sm:p-3 rounded-full transition-colors"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};











