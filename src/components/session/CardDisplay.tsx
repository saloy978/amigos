import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Card, DisplayMode, ReviewDirection, ReviewResult } from '../../types';
import { InputValidationService } from '../../services/inputValidation';

interface CardDisplayProps {
  card: Card;
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
  const [isRevealed, setIsRevealed] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [startTime] = useState(new Date());
  const [showButtons, setShowButtons] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isKnownToLearning = direction === ReviewDirection.KNOWN_TO_LEARNING;
  const questionText = isKnownToLearning ? card.translation : card.term;
  const answerText = isKnownToLearning ? card.term : card.translation;

  useEffect(() => {
    if (displayMode === DisplayMode.INPUT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [displayMode]);

  useEffect(() => {
    // Auto-reveal for demonstration mode
    if (displayMode === DisplayMode.DEMONSTRATION) {
      const timer = setTimeout(() => setIsRevealed(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [displayMode]);

  useEffect(() => {
    // Show buttons when card is revealed or in demonstration mode
    if (isRevealed || displayMode === DisplayMode.DEMONSTRATION) {
      setShowButtons(true);
    } else {
      setShowButtons(false);
    }
  }, [isRevealed, displayMode]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleAnswer = (correct: boolean) => {
    // Prevent multiple clicks
    if (showButtons === false) return;
    
    const timeSpent = new Date().getTime() - startTime.getTime();
    setShowButtons(false);
    onReview({
      correct,
      timeSpent
    });
    
    // Reset state for next card
    setIsRevealed(false);
    setUserInput('');
    setShowValidation(false);
  };

  const handleInputSubmit = () => {
    if (showValidation) return; // Prevent multiple submissions
    
    const isCorrect = InputValidationService.validateAnswer(userInput.trim(), answerText);
    setShowValidation(true);
    
    setTimeout(() => {
      handleAnswer(isCorrect);
    }, 2000); // Увеличиваем время показа результата
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      handleInputSubmit();
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 60) return '#f97316'; // orange-500
    if (progress < 90) return '#3b82f6'; // blue-500
    return '#10b981'; // green-500
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Card Stack Container */}
      <div className="relative w-full max-w-sm mb-8">
        {/* Background Cards (Stack Effect) */}
        <div className="absolute inset-0 transform translate-x-2 translate-y-2 opacity-40">
          <div className="bg-white rounded-3xl shadow-lg h-full border border-gray-200"></div>
        </div>
        <div className="absolute inset-0 transform translate-x-1 translate-y-1 opacity-70">
          <div className="bg-white rounded-3xl shadow-lg h-full border border-gray-200"></div>
        </div>
        
        {/* Main Card */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 min-h-[500px] flex flex-col">
          {/* Card Content */}
          <div className="px-8 pt-2 pb-8 flex flex-col flex-1">
            {/* Image */}

            {/* Image */}
            <div className="w-60 h-60 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg bg-gray-100 mx-auto mb-6">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.term}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                        <span class="text-4xl">📚</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}
            </div>

            {/* Translation under image */}
            {(isRevealed || displayMode === DisplayMode.DEMONSTRATION) && (
              <div className="text-4xl text-orange-700 text-center mb-4">
                {answerText}
              </div>
            )}

            {/* Learning Language (Word and Translation) */}
            <div className="mb-6">
              <div className="p-6">
                <div className="text-2xl font-semibold text-orange-900 text-center">
                  {questionText}
                </div>
              </div>
            </div>

            {/* Translation/Answer Section */}
            {/* Known Language (Bottom) */}
            {displayMode === DisplayMode.INPUT ? (
              <div className="space-y-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите перевод..."
                  className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                  disabled={showValidation}
                />
                
                {showValidation && (
                  <div className={`text-center p-3 rounded-lg ${
                    InputValidationService.validateAnswer(userInput.trim(), answerText)
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="font-medium">
                      {InputValidationService.validateAnswer(userInput.trim(), answerText)
                        ? 'Правильно!' 
                        : 'Неправильно'}
                    </div>
                    <div className="text-sm mt-1">Ответ: {answerText}</div>
                  </div>
                )}
                
                {!showValidation && (
                  <button
                    onClick={handleInputSubmit}
                    disabled={!userInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Проверить
                  </button>
                )}
                
                {showValidation && (
                  <div className="flex justify-center gap-12 mt-6">
                    <button
                      onClick={() => handleAnswer(false)}
                      className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl"
                    >
                      <Check className="w-8 h-8" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!isRevealed && displayMode !== DisplayMode.DEMONSTRATION && (
                  <button
                    onClick={handleReveal}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-medium flex items-center gap-2 mx-auto transition-colors"
                  >
                    Показать перевод
                  </button>
                )}
                
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Buttons */}
      {showButtons && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
          <div className="flex justify-center gap-12">
            <button
              onClick={() => handleAnswer(false)}
              disabled={!showButtons}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Не знаю
            </button>
            <button
              onClick={() => handleAnswer(true)}
              disabled={!showButtons}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Знаю
            </button>
          </div>
        </div>
      )}
    </div>
  );
};