import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './RouletteWheel.module.css';
import '../../styles/global.css';
import rouletteImage from '../../Assets/Rouletos.png';

interface RouletteWheelProps {
  balance: number;
  isSpinning: boolean;
  onSpinComplete: (result: string) => void;
  onUpdateBalance: () => void;
  onNextWord: () => void;
  onBackToMenu: () => void;
  playSpinSound: () => void;
  playButtonClick: () => void;
  currentWord: string | null;
  currentTranslation: string | null;
  currentArticle: string | null;
  selectedArticle: string | null;
  spinResult: string | null;
  lastResult: 'win' | 'lose' | null;
  speakSpanishWord: (word: string) => void;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  balance,
  isSpinning,
  onSpinComplete,
  onUpdateBalance,
  onNextWord,
  onBackToMenu,
  playSpinSound,
  playButtonClick,
  currentWord,
  currentTranslation,
  currentArticle,
  selectedArticle,
  spinResult,
  lastResult,
  speakSpanishWord
}) => {
  const [rotation, setRotation] = useState(0);
  const [prevRotation, setPrevRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(1600);
  const [showNextButton, setShowNextButton] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [hasUpdatedBalance, setHasUpdatedBalance] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Озвучиваем слово с правильным артиклем после завершения спина (только один раз)
  useEffect(() => {
    console.log('RouletteWheel useEffect для озвучивания:', {
      showNextButton,
      currentWord,
      spinResult,
      hasSpoken,
      hasUpdatedBalance,
      speakSpanishWord: !!speakSpanishWord
    });

    if (showNextButton && currentWord && spinResult && !hasSpoken) {
      const correctWord = `${spinResult} ${currentWord}`;
      console.log('RouletteWheel: Готовимся озвучить слово:', correctWord);
      
      // Обновляем баланс в момент показа результатов (только один раз)
      if (!hasUpdatedBalance) {
        console.log('RouletteWheel: Обновляем баланс');
        onUpdateBalance();
        setHasUpdatedBalance(true);
      }
      
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        console.log('RouletteWheel: Вызываем speakSpanishWord с:', correctWord);
        speakSpanishWord(correctWord);
        setHasSpoken(true);
        console.log('RouletteWheel: Озвучивание завершено');
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      console.log('RouletteWheel: Условия для озвучивания не выполнены');
    }
  }, [showNextButton, currentWord, spinResult, speakSpanishWord, hasSpoken, hasUpdatedBalance, onUpdateBalance]);

  // Cleanup таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
    };
  }, [touchTimeout]);

  useEffect(() => {
    if (isSpinning && !isAnimating) {
        console.log('RouletteWheel: Начинаем новый спин, сбрасываем состояния');
        setPrevRotation(rotation); // Сохраняем текущий угол
        setIsAnimating(true);
        setShowNextButton(false);
        setHasSpoken(false); // Сбрасываем состояние озвучивания для нового спина
        setHasUpdatedBalance(false); // Сбрасываем состояние обновления баланса для нового спина
        console.log('RouletteWheel: Состояния сброшены для нового спина');
      playSpinSound();
      
      // Случайная длительность анимации от 2 до 7 секунд
      const duration = 2000 + Math.random() * 5000; // 2000-7000ms
      setAnimationDuration(duration);
      
      // Определяем правильный артикль для текущего слова
      const correctArticle = currentArticle || 'el';
      
      // Случайное количество оборотов (от 5 до 10) для плавной анимации
      const spins = 5 + Math.random() * 5;
      
      // Генерируем случайный угол остановки
      const randomStopAngle = Math.random() * 360;
      
      // Вычисляем финальную позицию для плавной остановки
      const finalRotation = prevRotation + (spins * 360) + randomStopAngle;
      
      setRotation(finalRotation);
      
      // Определяем результат через время анимации
      setTimeout(() => {
        console.log('RouletteWheel: Спин завершен, устанавливаем showNextButton = true');
        setIsAnimating(false);
        setShowNextButton(true);
        onSpinComplete(correctArticle);
        console.log('RouletteWheel: showNextButton установлен, correctArticle:', correctArticle);
      }, duration);
    }
  }, [isSpinning, isAnimating, rotation, onSpinComplete, playSpinSound, currentArticle, prevRotation]);

  const handleNextWord = () => {
    console.log('RouletteWheel: handleNextWord вызван, сбрасываем состояния');
    playButtonClick();
    setShowNextButton(false);
    setHasSpoken(false); // Сбрасываем состояние озвучивания для следующего слова
    setHasUpdatedBalance(false); // Сбрасываем состояние обновления баланса для следующего слова
    console.log('RouletteWheel: Состояния сброшены, вызываем onNextWord');
    onNextWord();
  };

  const handleBackToMenu = () => {
    playButtonClick();
    onBackToMenu();
  };

  // Обработчик клика по экрану для кнопки "Siguiente"
  const handleScreenTap = (event: React.MouseEvent | React.TouchEvent) => {
    // Проверяем, что показывается кнопка "Siguiente" и клик не по кнопкам
    if (showNextButton && 
        !(event.target as HTMLElement).closest(`.${styles.backButton}`) &&
        !(event.target as HTMLElement).closest(`.${styles.nextBtn}`)) {
      handleNextWord();
    }
  };

  // Обработчик touch-событий для мобильных устройств
  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartTime(Date.now());
    
    // Очищаем предыдущий таймаут
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
    
    // Альтернативный подход: таймаут для обработки тапа
    const timeout = setTimeout(() => {
      if (showNextButton && 
          !(event.target as HTMLElement).closest(`.${styles.backButton}`) &&
          !(event.target as HTMLElement).closest(`.${styles.nextBtn}`)) {
        console.log('RouletteWheel: Touch timeout triggered, calling handleNextWord');
        handleNextWord();
      }
    }, 100); // Короткая задержка для обработки тапа
    
    setTouchTimeout(timeout);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime;
    
    console.log('RouletteWheel: Touch end event:', {
      touchDuration,
      showNextButton,
      target: event.target,
      isBackButton: !!(event.target as HTMLElement).closest(`.${styles.backButton}`),
      isNextButton: !!(event.target as HTMLElement).closest(`.${styles.nextBtn}`)
    });
    
    // Очищаем таймаут при завершении касания
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    
    // Проверяем, что это короткий тап (не долгое нажатие) и показывается кнопка "Siguiente"
    if (touchDuration < 500 && showNextButton && 
        !(event.target as HTMLElement).closest(`.${styles.backButton}`) &&
        !(event.target as HTMLElement).closest(`.${styles.nextBtn}`)) {
      console.log('RouletteWheel: Touch tap detected, calling handleNextWord');
      event.preventDefault();
      event.stopPropagation();
      handleNextWord();
    } else {
      console.log('RouletteWheel: Touch tap conditions not met');
    }
  };

  return (
    <div className="app-bg">
      <div className={styles.frameWrap}>
        <div 
          className={`${styles.wrap} ${showNextButton ? styles.clickable : ''}`} 
          onClick={handleScreenTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Кнопка "Назад" */}
          <div className="flex justify-start w-full">
            <button
              onClick={handleBackToMenu}
              className={styles.backButton}
              title="Назад"
            >
              <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Баланс */}
          <div className={styles.credits}>
            {balance} CRÉDITOS
          </div>

          {/* Рулетка */}
          <div className={styles.plate}>
            <div className={styles.rim}></div>
            <div className={styles.pin}></div>
            <div 
              className={`${styles.wheel} ${isAnimating ? styles.spinning : ''}`}
              style={{
                '--offsetdeg': `${rotation}deg`,
                '--current-rotation': `${prevRotation}deg`,
                '--animation-duration': `${animationDuration}ms`,
                transform: isAnimating ? undefined : `rotate(${rotation}deg)`
              } as React.CSSProperties}
            >
              <img 
                src={rouletteImage} 
                alt="Roulette Wheel" 
                className={styles.rouletteImage}
              />
            </div>
          </div>

          {/* Отображение результата */}
          {showNextButton && spinResult && lastResult && (
            <div className={styles.resultDisplay}>
              <div className={styles.correctWord}>
                {spinResult.toUpperCase()} {currentWord?.toUpperCase()}
              </div>
              {currentTranslation && (
                <div className={styles.translationText}>
                  {currentTranslation}
                </div>
              )}
              <div className={styles.resultInfo}>
                <div className={`${styles.resultText} ${lastResult === 'win' ? styles.resultWin : styles.resultLose}`}>
                  {lastResult === 'win' ? '¡GANASTE!' : '¡PERDISTE!'}
                </div>
                <div className={styles.resultDetails}>
                  Tu apuesta: {selectedArticle?.toUpperCase()}<br/>
                  Resultado: {spinResult.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Кнопка SPIN */}
          {!showNextButton && (
            <button
              className={styles.spinBtn}
              disabled={isAnimating}
              onClick={() => {
                if (!isAnimating) {
                  playButtonClick();
                }
              }}
            >
              SPIN
            </button>
          )}

          {/* Кнопка "Siguiente" */}
          {showNextButton && (
            <>
              <button
                className={styles.nextBtn}
                onClick={handleNextWord}
              >
                SIGUIENTE
              </button>
              {/* Подсказка о возможности тапа по экрану */}
              <div className={styles.tapHint}>
                Toca la pantalla para continuar
              </div>
              {/* Дополнительная подсказка для мобильных устройств */}
              <div className={styles.mobileHint}>
                📱 Tap anywhere to continue
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
