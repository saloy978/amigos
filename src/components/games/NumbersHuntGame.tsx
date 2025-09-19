import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Trophy, Clock, Target, X, ArrowLeft } from 'lucide-react';

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
  numberCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'super-hard';
  mode: 'time-hunt' | 'context';
}

// Базовые испанские числа
const BASIC_NUMBERS: { [key: number]: string } = {
  1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
  6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
  11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
  16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
  30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta', 70: 'setenta', 80: 'ochenta', 90: 'noventa',
  100: 'cien', 200: 'doscientos', 300: 'trescientos', 400: 'cuatrocientos', 500: 'quinientos',
  600: 'seiscientos', 700: 'setecientos', 800: 'ochocientos', 900: 'novecientos', 1000: 'mil'
};

// Функция для генерации испанского числа
const getSpanishNumber = (num: number): string => {
  if (num <= 0 || num > 1000) return num.toString();
  
  // Если число есть в базовом словаре
  if (BASIC_NUMBERS[num]) {
    return BASIC_NUMBERS[num];
  }
  
  // Числа 21-29
  if (num >= 21 && num <= 29) {
    const ones = num - 20;
    return `veinti${BASIC_NUMBERS[ones]}`;
  }
  
  // Числа 31-99
  if (num >= 31 && num <= 99) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    if (ones === 0) {
      return BASIC_NUMBERS[tens];
    }
    return `${BASIC_NUMBERS[tens]} y ${BASIC_NUMBERS[ones]}`;
  }
  
  // Числа 101-999
  if (num >= 101 && num <= 999) {
    const hundreds = Math.floor(num / 100) * 100;
    const remainder = num % 100;
    
    if (remainder === 0) {
      return BASIC_NUMBERS[hundreds];
    }
    
    const hundredsText = BASIC_NUMBERS[hundreds];
    const remainderText = getSpanishNumber(remainder);
    
    return `${hundredsText} ${remainderText}`;
  }
  
  return num.toString();
};

// Цвета для чисел
const NUMBER_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 
  'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

interface NumbersHuntGameProps {
  onNavigateBack: () => void;
}

export const NumbersHuntGame: React.FC<NumbersHuntGameProps> = ({ onNavigateBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'stats'>('menu');
  const [currentNumber, setCurrentNumber] = useState<number>(0);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
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
    timeLimit: 5,
    numberCount: 3,
    difficulty: 'easy',
    mode: 'time-hunt'
  });
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<'time-hunt' | 'context'>('time-hunt');
  const [contextPhrase, setContextPhrase] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Генерация случайных чисел в зависимости от уровня сложности
  const generateNumbers = useCallback((count: number, difficulty: string): number[] => {
    let min = 1, max = 10;
    
    switch (difficulty) {
      case 'easy':
        min = 1; max = 10;
        break;
      case 'medium':
        min = 1; max = 100;
        break;
      case 'hard':
        min = 1; max = 1000;
        break;
      case 'super-hard':
        min = 1; max = 1000;
        break;
    }

    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }, []);


  // Генерация контекстных фраз
  const generateContextPhrase = useCallback((number: number): string => {
    const spanishNumber = getSpanishNumber(number);
    const phrases = [
      `Tienes ${spanishNumber} manzanas`,
      `En la mesa hay ${spanishNumber} libros`,
      `Tengo ${spanishNumber} años`,
      `Hay ${spanishNumber} gatos`,
      `Compré ${spanishNumber} flores`,
      `En el jardín hay ${spanishNumber} árboles`,
      `Tengo ${spanishNumber} hermanos`,
      `En la clase hay ${spanishNumber} estudiantes`,
      `Compré ${spanishNumber} lápices`,
      `En la nevera hay ${spanishNumber} huevos`,
      `Tengo ${spanishNumber} monedas`,
      `En el parque hay ${spanishNumber} pájaros`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, []);

  // Воспроизведение звука числа
  const playNumberSound = useCallback((number: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const spanishText = getSpanishNumber(number);
      const utterance = new SpeechSynthesisUtterance(spanishText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Воспроизведение контекстной фразы
  const playContextPhrase = useCallback((phrase: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'es-ES';
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Генерация нового раунда
  const generateNewRound = useCallback(() => {
    let numbers: number[] = [];
    let targetNumber: number;
    let phraseToPlay: string | null = null;

    switch (gameMode) {
      case 'context':
        // Генерируем число в зависимости от уровня сложности
        let minNumber = 1, maxNumber = 20;
        switch (gameSettings.difficulty) {
          case 'easy':
            minNumber = 1; maxNumber = 20;
            break;
          case 'medium':
            minNumber = 1; maxNumber = 100;
            break;
          case 'hard':
            minNumber = 20; maxNumber = 1000;
            break;
          case 'super-hard':
            minNumber = 20; maxNumber = 1000;
            break;
        }
        targetNumber = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        const phrase = generateContextPhrase(targetNumber);
        setContextPhrase(phrase);
        phraseToPlay = phrase; // Сохраняем фразу для воспроизведения
        numbers = generateNumbers(gameSettings.numberCount, gameSettings.difficulty);
        if (!numbers.includes(targetNumber)) {
          numbers[0] = targetNumber;
        }
        break;
      case 'time-hunt':
      default:
        numbers = generateNumbers(gameSettings.numberCount, gameSettings.difficulty);
        targetNumber = numbers[Math.floor(Math.random() * numbers.length)];
    }

    setCurrentNumber(targetNumber);
    setAvailableNumbers(numbers.sort(() => Math.random() - 0.5));
    setSelectedNumber(null);
    setStartTime(new Date());
    setTimeLeft(gameSettings.timeLimit);

    // Воспроизведение звука
    setTimeout(() => {
      if (gameMode === 'context' && phraseToPlay) {
        playContextPhrase(phraseToPlay);
      } else {
        playNumberSound(targetNumber);
      }
    }, 500);
  }, [gameSettings, gameMode, generateNumbers, generateContextPhrase, playNumberSound, playContextPhrase]);

  // Обработка выбора числа
  const handleNumberSelect = useCallback((number: number) => {
    if (selectedNumber !== null) return;

    const reactionTime = new Date().getTime() - startTime.getTime();
    setSelectedNumber(number);
    setReactionTimes(prev => [...prev, reactionTime]);

    const isCorrect = number === currentNumber;

    if (isCorrect) {
      setGameStats(prev => ({
        ...prev,
        score: prev.score + (gameMode === 'time-hunt' ? Math.max(100 - Math.floor(reactionTime / 100), 10) : 100),
        correctAnswers: prev.correctAnswers + 1,
        totalAnswers: prev.totalAnswers + 1,
        combo: prev.combo + 1,
        maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
      }));
      playSuccessSound();
    } else {
      setGameStats(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 50),
        totalAnswers: prev.totalAnswers + 1,
        combo: 0
      }));
      playErrorSound();
    }

    setTimeout(() => {
      generateNewRound();
    }, 1500);
  }, [selectedNumber, startTime, gameMode, currentNumber, generateNewRound, playSuccessSound, playErrorSound]);

  // Запуск игры
  const startGame = useCallback(() => {
    setGameState('playing');
    setGameStats({
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      averageReactionTime: 0,
      combo: 0,
      maxCombo: 0
    });
    setReactionTimes([]);
    
    // Обновляем настройки в зависимости от режима
    if (gameMode === 'time-hunt') {
      setGameSettings(prev => ({
        ...prev,
        timeLimit: 5,
        numberCount: prev.difficulty === 'easy' ? 3 : prev.difficulty === 'medium' ? 5 : prev.difficulty === 'hard' ? 8 : 8,
        mode: 'time-hunt'
      }));
    } else if (gameMode === 'context') {
      setGameSettings(prev => ({
        ...prev,
        timeLimit: 10,
        numberCount: prev.difficulty === 'easy' ? 3 : prev.difficulty === 'medium' ? 5 : prev.difficulty === 'hard' ? 8 : 8,
        mode: 'context'
      }));
    }
    
    generateNewRound();
  }, [generateNewRound, gameMode]);

  // Завершение игры
  const endGame = useCallback(() => {
    setGameState('gameOver');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  // Возврат в меню
  const backToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  // Таймер
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState, timeLeft, endGame]);

  // Меню игры
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex flex-col p-4">
          {/* Кнопка "Назад" */}
          <div className="flex justify-start pt-4 pb-2">
            <button
              onClick={onNavigateBack}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {/* Основной контент */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full text-center">
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🔢</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Звуковая охота: Числа</h1>
                <p className="text-sm sm:text-base text-gray-600">Изучай испанские числа!</p>
              </div>
              
              {/* Выбор уровня сложности */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Уровень сложности</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => setGameSettings(prev => ({ ...prev, difficulty: 'easy' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      gameSettings.difficulty === 'easy' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Легкий
                  </button>
                  <button
                    onClick={() => setGameSettings(prev => ({ ...prev, difficulty: 'medium' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      gameSettings.difficulty === 'medium' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Средний
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGameSettings(prev => ({ ...prev, difficulty: 'hard' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      gameSettings.difficulty === 'hard' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Сложный
                  </button>
                  <button
                    onClick={() => setGameSettings(prev => ({ ...prev, difficulty: 'super-hard' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      gameSettings.difficulty === 'super-hard' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Супер сложный
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  {gameSettings.difficulty === 'easy' && 'Числа 1-10, 3 варианта'}
                  {gameSettings.difficulty === 'medium' && 'Числа 1-100, 5 вариантов'}
                  {gameSettings.difficulty === 'hard' && 'Числа 1-1000, 8 вариантов'}
                  {gameSettings.difficulty === 'super-hard' && 'Числа 1-1000, 8 вариантов, только звук'}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={() => {
                    setGameMode('time-hunt');
                    startGame();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 sm:py-4 px-6 rounded-2xl font-semibold text-base sm:text-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105"
                >
                  ⏰ Охота на время
                </button>
                
                <button
                  onClick={() => {
                    setGameMode('context');
                    startGame();
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 sm:py-4 px-6 rounded-2xl font-semibold text-base sm:text-lg hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:scale-105"
                >
                  📝 Контекст
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Статистика
  if (gameState === 'stats') {
    const accuracy = gameStats.totalAnswers > 0 ? Math.round((gameStats.correctAnswers / gameStats.totalAnswers) * 100) : 0;
    const avgReactionTime = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full text-center">
            <div className="text-center mb-6">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Статистика</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-600">{gameStats.score}</div>
                <div className="text-sm text-gray-600">Очки</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-gray-600">Точность</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-600">{gameStats.maxCombo}</div>
                <div className="text-sm text-gray-600">Макс. серия</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-600">{avgReactionTime}мс</div>
                <div className="text-sm text-gray-600">Скорость</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={backToMenu}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-2xl font-semibold transition-colors"
              >
                В меню
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Игровой процесс
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
                onClick={() => {
                  if (gameMode === 'context') {
                    playContextPhrase(contextPhrase);
                  } else {
                    playNumberSound(currentNumber);
                  }
                }}
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
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${(timeLeft / gameSettings.timeLimit) * 100}, 100`}
                      className="text-gray-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{timeLeft}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <span className="text-lg font-bold text-gray-800">{gameStats.score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Основная игровая область */}
        <div className="px-4 pb-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
            {/* Информация о режиме */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {gameMode === 'time-hunt' && 'Охота на время'}
                {gameMode === 'context' && gameSettings.difficulty === 'super-hard' && 'Контекст (только звук)'}
                {gameMode === 'context' && gameSettings.difficulty !== 'super-hard' && 'Контекст'}
              </h2>
              {gameMode === 'context' && contextPhrase && gameSettings.difficulty !== 'super-hard' && (
                <p className="text-sm text-gray-600 italic">"{contextPhrase}"</p>
              )}
              {gameMode === 'context' && gameSettings.difficulty === 'super-hard' && (
                <p className="text-sm text-gray-600 italic">Слушайте фразу и выбирайте правильное число</p>
              )}
            </div>

            {/* Сетка чисел */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {availableNumbers.map((number, index) => {
                const isSelected = selectedNumber === number;
                const isCorrect = number === currentNumber;
                const colorClass = NUMBER_COLORS[index % NUMBER_COLORS.length];
                
                return (
                  <button
                    key={`${number}-${index}`}
                    onClick={() => handleNumberSelect(number)}
                    disabled={selectedNumber !== null}
                    className={`
                      ${colorClass} text-white font-bold text-2xl sm:text-3xl py-4 sm:py-6 rounded-2xl
                      transition-all transform hover:scale-105 active:scale-95
                      ${isSelected ? (isCorrect ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400') : ''}
                      ${selectedNumber !== null ? 'opacity-50' : 'hover:shadow-lg'}
                    `}
                  >
                    {number}
                  </button>
                );
              })}
            </div>

            {/* Прогресс */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 mb-2">
                Правильных: {gameStats.correctAnswers} / {gameStats.totalAnswers}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${gameStats.totalAnswers > 0 ? (gameStats.correctAnswers / gameStats.totalAnswers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




