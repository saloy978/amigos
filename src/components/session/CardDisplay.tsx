import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { UserCardWithContent, DisplayMode, ReviewDirection, ReviewResult } from '../../types';
import { InputValidationService } from '../../services/inputValidation';
import { TextToSpeechService } from '../../services/textToSpeechService';
import { useAppContext } from '../../context/AppContext';
import { CardDisplayModes } from '../../context/cards/card_modes';
import { CircularProgress } from '../common/CircularProgress';
import { CardDisplayConfigUtils } from '../../config/cardDisplayConfig';

interface CardDisplayProps {
  card: UserCardWithContent;
  displayMode: DisplayMode;
  direction: ReviewDirection;
  onReview: (result: ReviewResult) => void;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  displayMode,
  direction,
  onReview
}) => {
  const { state } = useAppContext();
  const [isRevealed, setIsRevealed] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [startTime] = useState(new Date());
  const [showButtons, setShowButtons] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSpanishWord, setShowSpanishWord] = useState(false);
  const [audioPlayedForSpanishWord, setAudioPlayedForSpanishWord] = useState(false);
  const [showListeningContent, setShowListeningContent] = useState(false); // Для LISTENING_1
  const [listeningInput, setListeningInput] = useState(''); // Для LISTENING_2
  const [showListeningValidation, setShowListeningValidation] = useState(false); // Для LISTENING_2
  const [showModeIndicator, setShowModeIndicator] = useState(false); // Для скрытия/показа индикатора режимов
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  const isKnownToLearning = direction === ReviewDirection.KNOWN_TO_LEARNING;

  // Функция для воспроизведения аудио - только испанские слова
  const playAudio = async (text?: string) => {
    console.log('🔊 CardDisplay: playAudio called');
    if (isPlayingAudio) {
      console.log('🔊 CardDisplay: Already playing, skipping');
      return; // Предотвращаем множественные воспроизведения
    }
    
    // Определяем, какой текст произносить - только испанские слова
    const spanishText = text || card.term; // Всегда испанское слово
    console.log('🔊 CardDisplay: Spanish text to speak:', spanishText);
    
    setIsPlayingAudio(true);
    try {
      const languageCode = 'es-ES'; // Полный код языка для испанского (Испания)
      console.log('🔊 CardDisplay: Language code:', languageCode);
      
      // Останавливаем любые текущие воспроизведения перед началом нового
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // На мобильных устройствах добавляем небольшую задержку
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('📱 Mobile device detected, adding delay');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const result = await TextToSpeechService.speakText(spanishText, languageCode);
      console.log('🔊 CardDisplay: Speech result:', result);
    } catch (error) {
      console.error('❌ CardDisplay: Ошибка воспроизведения аудио:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    if ((displayMode === DisplayMode.TRANSLATION_TO_WORD || displayMode === DisplayMode.LISTENING_2) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [displayMode]);

  // Проверяем доступные голоса при загрузке компонента
  useEffect(() => {
    // Небольшая задержка, чтобы голоса успели загрузиться
    const timer = setTimeout(() => {
      TextToSpeechService.checkAvailableVoices();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Сбрасываем состояния при смене карточки
  useEffect(() => {
    setShowSpanishWord(false);
    setAudioPlayedForSpanishWord(false);
    setShowListeningContent(false);
    setListeningInput('');
    setShowListeningValidation(false);
  }, [card.cardId]);

  useEffect(() => {
    // Auto-reveal for demonstration mode using configuration
    if (CardDisplayModes.shouldShowTranslationAutomatically(displayMode)) {
      const delay = CardDisplayModes.getTranslationDelay(displayMode);
      const timer = setTimeout(() => setIsRevealed(true), delay);
      return () => clearTimeout(timer);
    }
  }, [displayMode]);

  // Reset processing flag when card changes
  useEffect(() => {
    isProcessingRef.current = false;
  }, [card.cardId]);

  useEffect(() => {
    // Always show buttons (Stop and Run)
    setShowButtons(true);
  }, []);

  // Тест API при загрузке компонента
  useEffect(() => {
    TextToSpeechService.testAPI().then(result => {
      console.log('🧪 API Test result:', result);
    });
    
    // Проверяем доступные голоса на устройстве
    TextToSpeechService.checkAvailableVoices();
  }, []);


  // Автоматическое воспроизведение для режимов WORD и TRANSLATION_TO_WORD (сразу при появлении карточки)
  useEffect(() => {
    if ((displayMode === DisplayMode.WORD || displayMode === DisplayMode.TRANSLATION_TO_WORD) && card && !audioPlayedForSpanishWord) {
      console.log('🔊 WORD/TRANSLATION_TO_WORD mode: Auto-audio on card appearance');
      
      // Определяем испанский текст для произношения
      let spanishText;
      let languageCode;
      
      if (displayMode === DisplayMode.TRANSLATION_TO_WORD) {
        // В режиме TRANSLATION_TO_WORD всегда произносим испанское слово
        spanishText = card.term;
        const learningLanguageCode = state.currentLanguagePair?.learningLanguageCode || 'es';
        languageCode = TextToSpeechService.getLanguageCode(true, learningLanguageCode); // Всегда испанский
      } else {
        // В режиме WORD используем логику направления
        spanishText = isKnownToLearning ? card.term : card.translation;
        const learningLanguageCode = state.currentLanguagePair?.learningLanguageCode || 'es';
        languageCode = TextToSpeechService.getLanguageCode(isKnownToLearning, learningLanguageCode);
      }
      
      console.log('🔊 WORD/TRANSLATION_TO_WORD mode: Playing audio:', { 
        spanishText, 
        languageCode,
        displayMode
      });
      
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        // Останавливаем любые текущие воспроизведения перед началом нового
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        TextToSpeechService.speakText(spanishText, languageCode).catch(console.error);
        setAudioPlayedForSpanishWord(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [displayMode, card.cardId, isKnownToLearning, state.currentLanguagePair?.learningLanguageCode, audioPlayedForSpanishWord]);

  // Автоматическое воспроизведение для режимов аудирования (сразу при появлении карточки)
  useEffect(() => {
    if ((displayMode === DisplayMode.LISTENING_1 || displayMode === DisplayMode.LISTENING_2) && card && !audioPlayedForSpanishWord) {
      console.log('🔊 LISTENING mode: Auto-audio on card appearance');
      
      // В режимах аудирования всегда произносим испанское слово
      const spanishText = card.term;
      const learningLanguageCode = state.currentLanguagePair?.learningLanguageCode || 'es';
      const languageCode = TextToSpeechService.getLanguageCode(true, learningLanguageCode); // Всегда испанский
      
      console.log('🔊 LISTENING mode: Playing audio:', { 
        spanishText, 
        languageCode 
      });
      
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        // Останавливаем любые текущие воспроизведения перед началом нового
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        TextToSpeechService.speakText(spanishText, languageCode).catch(console.error);
        setAudioPlayedForSpanishWord(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [displayMode, card.cardId, state.currentLanguagePair?.learningLanguageCode, audioPlayedForSpanishWord]);

  // Автоматическое воспроизведение для других режимов при показе изучаемых слов
  useEffect(() => {
    if (isRevealed && card && displayMode !== DisplayMode.WORD) {
      // В режиме TRANSLATION озвучка происходит только когда показано испанское слово и еще не воспроизводилась
      if (displayMode === DisplayMode.TRANSLATION && (!showSpanishWord || audioPlayedForSpanishWord)) {
        console.log('🔊 TRANSLATION mode: Skipping auto-audio', { 
          showSpanishWord, 
          audioPlayedForSpanishWord 
        });
        return;
      }
      
      // Определяем испанский текст для произношения (изучаемые слова)
      const spanishText = isKnownToLearning ? card.term : card.translation;
      const learningLanguageCode = state.currentLanguagePair?.learningLanguageCode || 'es';
      const languageCode = TextToSpeechService.getLanguageCode(isKnownToLearning, learningLanguageCode);
      
      console.log('🔊 Auto-audio triggered:', { 
        displayMode, 
        isRevealed, 
        showSpanishWord, 
        audioPlayedForSpanishWord,
        spanishText, 
        languageCode 
      });
      
      // Небольшая задержка для лучшего UX
      const timer = setTimeout(() => {
        // Останавливаем любые текущие воспроизведения перед началом нового
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        TextToSpeechService.speakText(spanishText, languageCode).catch(console.error);
        
        // Отмечаем, что озвучка была воспроизведена для испанского слова
        if (displayMode === DisplayMode.TRANSLATION) {
          setAudioPlayedForSpanishWord(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isRevealed, card.cardId, isKnownToLearning, state.currentLanguagePair?.learningLanguageCode, displayMode, showSpanishWord, audioPlayedForSpanishWord]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleAnswer = useCallback((correct: boolean) => {
    // Prevent multiple clicks using ref
    if (isProcessingRef.current) {
      console.log('🚫 Button click ignored - already processing');
      return;
    }
    
    if (!showButtons) {
      console.log('🚫 Button click ignored - buttons disabled');
      return;
    }
    
    console.log('✅ Button clicked, processing answer:', correct);
    
    // Set processing flag immediately
    isProcessingRef.current = true;
    
    const timeSpent = new Date().getTime() - startTime.getTime();
    
    // Immediately disable buttons to prevent double clicks
    setShowButtons(false);
    console.log('🔒 Buttons disabled');
    
    // В режиме WORD сначала показываем перевод, затем через 2 секунды переходим к следующей карточке
    if (displayMode === DisplayMode.WORD && !isRevealed) {
      console.log('📖 WORD mode: showing translation first');
      setIsRevealed(true);
      
      // Через 2 секунды переходим к следующей карточке
      setTimeout(() => {
        console.log('⏭️ WORD mode: moving to next card');
        onReview({
          correct,
          timeSpent
        });
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }, 2000);
    } 
    // В режиме TRANSLATION показываем испанское слово на 2 секунды, озвучиваем и переходим к следующей карточке
    else if (displayMode === DisplayMode.TRANSLATION) {
      console.log('🔄 TRANSLATION mode: showing Spanish word and playing audio');
      setShowSpanishWord(true);
      
      // Озвучиваем испанское слово только если оно еще не было показано (не было тапа)
      if (!audioPlayedForSpanishWord) {
        const spanishText = card.term;
        const languageCode = 'es-ES';
        console.log('🔊 TRANSLATION mode: Playing audio for Spanish word (first time):', { spanishText, languageCode });
        
        // Останавливаем любые текущие воспроизведения перед началом нового
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        
        TextToSpeechService.speakText(spanishText, languageCode).catch(console.error);
        setAudioPlayedForSpanishWord(true);
        
        // Если испанское слово показывается впервые, ждем 2 секунды
        console.log('⏱️ TRANSLATION mode: First time showing Spanish word, waiting 2 seconds');
        setTimeout(() => {
          console.log('⏭️ TRANSLATION mode: moving to next card (after delay)');
          onReview({
            correct,
            timeSpent
          });
          
          // Reset processing flag
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 100);
        }, 2000);
      } else {
        console.log('🔊 TRANSLATION mode: Skipping audio - already played for this card');
        console.log('⏭️ TRANSLATION mode: Spanish word already shown, moving to next card immediately');
        
        // Если испанское слово уже было показано, переходим сразу
        onReview({
          correct,
          timeSpent
        });
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }
    } 
    // В режиме TRANSLATION_TO_WORD проверяем правильность перевода
    else if (displayMode === DisplayMode.TRANSLATION_TO_WORD) {
      console.log('🔄 TRANSLATION_TO_WORD mode: checking translation correctness');
      
      // Проверяем, не пустое ли поле ввода
      const trimmedInput = userInput.trim();
      const isEmpty = trimmedInput === '';
      
      // Проверяем правильность введенного перевода
      const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
      console.log('✅ TRANSLATION_TO_WORD mode: translation check result:', { 
        userInput: trimmedInput, 
        correctAnswer: card.translation, 
        isEmpty,
        isCorrect,
        buttonPressed: correct ? 'Знаю' : 'Не знаю'
      });
      
      // Показываем результат проверки и русский перевод с картинкой
      setShowValidation(true);
      setIsRevealed(true);
      
      // Определяем финальный результат на основе нажатой кнопки
      let finalResult: boolean;
      if (correct) {
        // Кнопка "Знаю" - результат зависит от правильности перевода
        finalResult = isCorrect;
        console.log('✅ TRANSLATION_TO_WORD mode: "Знаю" button - result based on correctness:', finalResult);
      } else {
        // Кнопка "Не знаю" - всегда false
        finalResult = false;
        console.log('❌ TRANSLATION_TO_WORD mode: "Не знаю" button - always false');
      }
      
      // Показываем результат проверки 2 секунды, затем переходим к следующей карточке
      setTimeout(() => {
        console.log('⏭️ TRANSLATION_TO_WORD mode: moving to next card with result:', finalResult);
        onReview({
          correct: finalResult,
          timeSpent
        });
        
        // Reset processing flag
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }, 2000);
    } else {
      // Для других режимов сразу переходим к следующей карточке
      onReview({
        correct,
        timeSpent
      });
      
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    }
  }, [showButtons, startTime, onReview, displayMode, isRevealed, card, audioPlayedForSpanishWord]);

  const handleInputSubmit = () => {
    if (showValidation) return; // Prevent multiple submissions
    
    const isCorrect = InputValidationService.validateAnswer(userInput.trim(), card.translation);
    setShowValidation(true);
    
    setTimeout(() => {
      handleAnswer(isCorrect);
    }, 2000); // Увеличиваем время показа результата
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (displayMode === DisplayMode.TRANSLATION_TO_WORD) {
        if (!showValidation) {
          // Первое нажатие Enter - проверяем правильность перевода и изменяем прогресс
          console.log('🔄 TRANSLATION_TO_WORD mode: Enter - checking translation and updating progress');
          
          // Проверяем, не пустое ли поле ввода
          const trimmedInput = userInput.trim();
          const isEmpty = trimmedInput === '';
          
          // Проверяем правильность введенного перевода
          const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
          console.log('✅ TRANSLATION_TO_WORD mode: Enter translation check result:', { 
            userInput: trimmedInput, 
            correctAnswer: card.translation, 
            isEmpty,
            isCorrect 
          });
          
          // Показываем результат проверки и русский перевод с картинкой
          setShowValidation(true);
          setIsRevealed(true);
          
          // Показываем результат проверки 2 секунды, затем переходим к следующей карточке
          setTimeout(() => {
            console.log('⏭️ TRANSLATION_TO_WORD mode: Enter - moving to next card with result:', isCorrect);
            onReview({
              correct: isCorrect, // Передаем результат проверки для изменения прогресса
              timeSpent: new Date().getTime() - startTime.getTime()
            });
          }, 2000);
        } else if (showValidation) {
          // Второе нажатие Enter - переходим к следующей карточке (если уже показан результат)
          const trimmedInput = userInput.trim();
          const isEmpty = trimmedInput === '';
          const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
          handleAnswer(isCorrect);
        }
      } else if (displayMode === DisplayMode.LISTENING_2) {
        if (listeningInput.trim() && !showListeningValidation) {
          // Первое нажатие Enter - показываем результат
          setShowListeningValidation(true);
        } else if (showListeningValidation) {
          // Второе нажатие Enter - переходим к следующей карточке
          const isCorrect = InputValidationService.validateAnswer(listeningInput.trim(), card.term);
          handleAnswer(isCorrect);
        }
      } else {
        // В других режимах работает как раньше
        if (userInput.trim()) {
          handleInputSubmit();
        }
      }
    }
  };


  return (
    <div className="w-full flex flex-col items-center">
      {/* Card Stack Container */}
      <div className="relative w-full max-w-sm mb-8">
        {/* Background Cards (Stack Effect) */}
        <div className="absolute inset-0 transform translate-x-2 translate-y-2 opacity-40">
          <div className="bg-white rounded-3xl h-full"></div>
        </div>
        <div className="absolute inset-0 transform translate-x-1 translate-y-1 opacity-70">
          <div className="bg-white rounded-3xl h-full"></div>
        </div>
        
        {/* Main Card */}
        <div 
          className="relative bg-white rounded-3xl h-[420px] flex flex-col cursor-pointer"
          onClick={() => {
            const modeConfig = CardDisplayModes.getModeConfig(displayMode);
            
            // В режиме TRANSLATION обрабатываем тап специально
            if (displayMode === DisplayMode.TRANSLATION) {
              if (!isRevealed) {
                // Первый тап - показываем перевод (reveal)
                console.log('🔄 TRANSLATION mode: First tap - revealing translation');
                handleReveal();
              } else if (!showSpanishWord) {
                // Второй тап - показываем испанское слово
                console.log('🔄 TRANSLATION mode: Second tap - showing Spanish word');
                console.log('🔄 Current state:', { displayMode, isRevealed, showValidation, showSpanishWord });
                setShowSpanishWord(true);
                // Озвучка произойдет автоматически через useEffect при изменении showSpanishWord
              }
            } 
            // В режиме LISTENING_1 показываем контент по тапу
            else if (displayMode === DisplayMode.LISTENING_1 && !showListeningContent) {
              console.log('🔄 LISTENING_1 mode: Tap - showing content');
              setShowListeningContent(true);
            }
            // В режиме LISTENING_2 тап переводит к следующей карточке после валидации
            else if (displayMode === DisplayMode.LISTENING_2 && showListeningValidation) {
              console.log('🔄 LISTENING_2 mode: Tap - moving to next card');
              const isCorrect = InputValidationService.validateAnswer(listeningInput.trim(), card.term);
              handleAnswer(isCorrect);
            }
            // В режиме TRANSLATION_TO_WORD тап проверяет правильность перевода и изменяет прогресс
            else if (displayMode === DisplayMode.TRANSLATION_TO_WORD && !isRevealed) {
              console.log('🔄 TRANSLATION_TO_WORD mode: Tap - checking translation and updating progress');
              
              // Проверяем, не пустое ли поле ввода
              const trimmedInput = userInput.trim();
              const isEmpty = trimmedInput === '';
              
              // Проверяем правильность введенного перевода
              const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
              console.log('✅ TRANSLATION_TO_WORD mode: tap translation check result:', { 
                userInput: trimmedInput, 
                correctAnswer: card.translation, 
                isEmpty,
                isCorrect 
              });
              
              // Показываем результат проверки и русский перевод с картинкой
              setShowValidation(true);
              setIsRevealed(true);
              
              // Показываем результат проверки 2 секунды, затем переходим к следующей карточке
              setTimeout(() => {
                console.log('⏭️ TRANSLATION_TO_WORD mode: tap - moving to next card with result:', isCorrect);
                onReview({
                  correct: isCorrect, // Передаем результат проверки для изменения прогресса
                  timeSpent: new Date().getTime() - startTime.getTime()
                });
              }, 2000);
            }
            else if (!isRevealed && !modeConfig?.showTranslationAutomatically && !modeConfig?.showInputField) {
              handleReveal();
            } else if (displayMode === DisplayMode.TRANSLATION_TO_WORD && showValidation) {
              // В режиме ввода после проверки тап переводит к следующей карточке
              const trimmedInput = userInput.trim();
              const isEmpty = trimmedInput === '';
              const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
              handleAnswer(isCorrect);
            }
          }}
        >
          {/* Progress Indicator */}
          {CardDisplayConfigUtils.shouldShowProgressIndicator() && (
            <div className="absolute top-4 left-4 z-10">
              <CircularProgress
                progress={card.progress}
                size={CardDisplayConfigUtils.getProgressIndicatorSize()}
                strokeWidth={3}
                showPercentage={CardDisplayConfigUtils.shouldShowProgressPercentage()}
                color={card.progress >= 70 ? '#10B981' : card.progress >= 30 ? '#3B82F6' : '#F59E0B'}
                backgroundColor="#E5E7EB"
              />
            </div>
          )}

          {/* Mode Indicator (скрывающийся) */}
          <div className="absolute top-4 right-4 z-10">
            {/* Кнопка для скрытия/показа */}
            <button
              onClick={() => setShowModeIndicator(!showModeIndicator)}
              className="mb-2 bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium transition-colors"
            >
              {showModeIndicator ? 'Скрыть' : displayMode}
            </button>
            
            {/* Скрывающийся блок с информацией */}
            {showModeIndicator && (
              <div className="space-y-1">
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {displayMode}
                </div>
                {/* Дополнительная информация о состоянии */}
                <div className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
                  {isRevealed ? 'revealed' : 'hidden'} | {showValidation ? 'validated' : 'input'} | {showSpanishWord ? 'spanish' : 'no-spanish'} | {audioPlayedForSpanishWord ? 'audio-played' : 'no-audio'} | {showListeningContent ? 'listening-content' : 'no-content'} | {showListeningValidation ? 'listening-validated' : 'no-listening-validation'}
                </div>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="px-6 pt-2 pb-6 flex flex-col flex-1">
            {/* 1. ВЕРХ: Картинка */}
            <div className="w-48 h-48 rounded-2xl flex items-center justify-center relative overflow-hidden bg-gray-100 mx-auto mb-4">
              {/* В режимах LISTENING_1 и TRANSLATION_TO_WORD показываем картинку только после тапа/показа перевода */}
              {(() => {
                const shouldShowImage = (displayMode !== DisplayMode.LISTENING_1 || showListeningContent) &&
                                      (displayMode !== DisplayMode.TRANSLATION_TO_WORD || isRevealed);
                return shouldShowImage && card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.term}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-white flex items-center justify-center">
                          <div class="w-full h-full bg-white flex items-center justify-center">
                            <span class="text-gray-300 text-sm">Нет изображения</span>
                          </div>
                        </div>
                      `;
                    }}
                  />
                ) : shouldShowImage ? (
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      <span className="text-gray-300 text-sm">   </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      {displayMode !== DisplayMode.TRANSLATION_TO_WORD && (
                        <span className="text-gray-500 text-lg">👂 Нажмите, чтобы показать</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. СЕРЕДИНА: Испанское слово (фиксированная позиция) */}
            <div className="h-16 flex items-center justify-center mb-3">
              {/* Показываем испанское слово в режимах DEMONSTRATION, WORD, TRANSLATION_TO_WORD, TRANSLATION (после тапа) и LISTENING_1 (после тапа) */}
              {(() => {
                const shouldShow = ((displayMode === DisplayMode.DEMONSTRATION) ||
                  (displayMode === DisplayMode.WORD) || 
                  (displayMode === DisplayMode.TRANSLATION_TO_WORD) ||
                  (displayMode === DisplayMode.TRANSLATION && showSpanishWord) ||
                  (displayMode === DisplayMode.LISTENING_1 && showListeningContent));
                console.log('🔍 Spanish word display check:', { 
                  displayMode, 
                  isRevealed, 
                  showSpanishWord,
                  showListeningContent,
                  shouldShow,
                  isDemonstration: displayMode === DisplayMode.DEMONSTRATION,
                  isWord: displayMode === DisplayMode.WORD,
                  isTranslationWithSpanish: displayMode === DisplayMode.TRANSLATION && showSpanishWord,
                  isListening1WithContent: displayMode === DisplayMode.LISTENING_1 && showListeningContent
                });
                return shouldShow;
              })() && (
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl font-semibold text-orange-600 text-center">
                    {card.term}
                  </div>
                  {/* Кнопка аудио для испанского слова */}
                  <button
                    onClick={() => playAudio(card.term)}
                    disabled={isPlayingAudio}
                    className={`p-1 rounded-full transition-all ${
                      isPlayingAudio 
                        ? 'bg-transparent cursor-not-allowed' 
                        : 'bg-transparent hover:bg-orange-100/30 cursor-pointer'
                    }`}
                    title="Произнести испанское слово"
                  >
                    {isPlayingAudio ? (
                      <div className="w-3 h-3 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-orange-600"></div>
                      </div>
                    ) : (
                      <Volume2 className="w-3 h-3 text-orange-600" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 3. НИЗ: Русский перевод (фиксированная позиция) */}
            <div className="h-16 flex items-center justify-center mb-3">
              {/* Показываем русский перевод в режимах DEMONSTRATION, TRANSLATION, TRANSLATION_TO_WORD (по тапу), WORD (после тапа) и LISTENING_1 (после тапа) */}
              {(CardDisplayModes.shouldShowTranslationAutomatically(displayMode) || 
                (displayMode === DisplayMode.WORD && isRevealed) ||
                (displayMode === DisplayMode.TRANSLATION_TO_WORD && isRevealed) ||
                (displayMode === DisplayMode.LISTENING_1 && showListeningContent)) && (
                <div className="flex items-center justify-center gap-3">
                  <div className="text-2xl text-gray-600 text-center">
                    {card.translation}
                  </div>
                  {/* Русский перевод не озвучивается */}
                </div>
              )}
            </div>

            {/* Input Field Section (фиксированное место) */}
            <div className="min-h-[56px] flex flex-col justify-center">
              {(CardDisplayModes.shouldShowInputField(displayMode) || displayMode === DisplayMode.LISTENING_2) && (
                <div className="space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={displayMode === DisplayMode.LISTENING_2 ? listeningInput : userInput}
                    onChange={(e) => {
                      if (displayMode === DisplayMode.LISTENING_2) {
                        setListeningInput(e.target.value);
                      } else {
                        setUserInput(e.target.value);
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={displayMode === DisplayMode.LISTENING_2 ? "Введите испанское слово..." : "Введите перевод..."}
                    className="w-full p-4 bg-transparent rounded-2xl text-center text-xl transition-all focus:outline-none"
                    autoFocus
                    disabled={displayMode === DisplayMode.LISTENING_2 ? showListeningValidation : showValidation}
                  />
                  
                  {(showValidation || showListeningValidation) && (
                    <div className={`text-center p-3 rounded-lg ${
                      (() => {
                        if (displayMode === DisplayMode.LISTENING_2) {
                          return InputValidationService.validateAnswer(listeningInput.trim(), card.term);
                        } else {
                          // Для TRANSLATION_TO_WORD проверяем пустое поле
                          const trimmedInput = userInput.trim();
                          const isEmpty = trimmedInput === '';
                          return !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
                        }
                      })()
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <div className="font-medium">
                        {(() => {
                          if (displayMode === DisplayMode.LISTENING_2) {
                            return InputValidationService.validateAnswer(listeningInput.trim(), card.term)
                              ? 'Правильно!'
                              : 'Неправильно';
                          } else {
                            // Для TRANSLATION_TO_WORD проверяем пустое поле
                            const trimmedInput = userInput.trim();
                            const isEmpty = trimmedInput === '';
                            const isCorrect = !isEmpty && InputValidationService.validateAnswer(trimmedInput, card.translation);
                            return isCorrect ? 'Правильно!' : 'Неправильно';
                          }
                        })()}
                      </div>
                      <div className="text-sm mt-1">
                        Ответ: {displayMode === DisplayMode.LISTENING_2 ? card.term : card.translation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons - фиксированное место под карточкой */}
      <div className="w-full max-w-sm mt-6 min-h-[120px] flex items-center justify-center">
        {CardDisplayModes.shouldShowActionButtons(displayMode) && (
          <div className={`flex justify-center gap-12 transition-opacity duration-200 ${
            showButtons ? 'opacity-100' : 'opacity-50'
          }`}>
            <button
              onClick={() => handleAnswer(false)}
              className={`p-6 rounded-2xl transition-all duration-200 transform hover:scale-105 cursor-pointer bg-transparent hover:bg-white/10 ${
                !showButtons ? 'opacity-50 pointer-events-none' : ''
              }`}
              disabled={!showButtons}
            >
              {isProcessingRef.current ? (
                <div className="w-24 h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : (
                <img 
                  src="/assets/Stop.png" 
                  alt="Не знаю" 
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-24 h-24 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">✕</div>';
                  }}
                />
              )}
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className={`p-6 rounded-2xl transition-all duration-200 transform hover:scale-105 cursor-pointer bg-transparent hover:bg-white/10 ${
                !showButtons ? 'opacity-50 pointer-events-none' : ''
              }`}
              disabled={!showButtons}
            >
              {isProcessingRef.current ? (
                <div className="w-24 h-24 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <img 
                  src="/assets/run.png" 
                  alt="Знаю" 
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-24 h-24 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">✓</div>';
                  }}
                />
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};