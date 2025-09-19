import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Volume2, BookOpen, MessageSquare, Target, Download, Play } from 'lucide-react';
import { introLesson } from '../../context/lessons/intro';
import { lesson1Content } from '../../context/lessons/lesson1';
import { CardService } from '../../services/cardService';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { useTheoryTracking } from '../../hooks/useTheoryTracking';
import { useDialoguesTracking } from '../../hooks/useDialoguesTracking';
import { LessonContent } from '../../types';
import { getLessonWords } from '../../context/lessons/words/index';
import { useAppContext } from '../../context/AppContext';
import { logInfo, logWarn, logError, logDebug } from '../../utils/browserLogger';

interface LessonScreenProps {
  lessonId?: string;
  onBack: () => void;
  onUpdateProgress?: (progress: number) => void;
  onStartLearning?: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({ lessonId, onBack, onUpdateProgress, onStartLearning }) => {
  const { dispatch } = useAppContext();
  const [activeSection, setActiveSection] = useState<'theory' | 'dialogues' | 'practice'>('theory');
  const [practiceAnswers, setPracticeAnswers] = useState<string[]>([]);
  const [showPracticeResults, setShowPracticeResults] = useState(false);
  const [isAddingWords, setIsAddingWords] = useState(false);
  const [wordsAdded, setWordsAdded] = useState(false);
  const [addWordsMessage, setAddWordsMessage] = useState('');

  // Получаем контент урока по ID
  const getLessonById = (id?: string): LessonContent => {
    switch (id) {
      case 'intro':
        return introLesson;
      case 'lesson-1':
      case 'lesson1':
        return lesson1Content;
      default:
        return introLesson; // По умолчанию возвращаем intro урок
    }
  };

  const lesson = getLessonById(lessonId);

  // Универсальная система отслеживания прогресса
  const {
    totalProgress,
    progressLoaded,
    markTheoryViewed,
    markDialoguesListened,
    markPracticeCompleted
  } = useLessonProgress(lessonId);

  // Отслеживание теории
  useTheoryTracking({
    activeSection,
    theorySection: 'theory',
    onTheoryViewed: markTheoryViewed
  });

  // Отслеживание диалогов
  useDialoguesTracking({
    onDialoguesListened: markDialoguesListened
  });

  const handlePracticeAnswerChange = (index: number, value: string) => {
    const newAnswers = [...practiceAnswers];
    newAnswers[index] = value;
    setPracticeAnswers(newAnswers);
  };

  const checkPracticeAnswers = () => {
    setShowPracticeResults(true);
    const score = getPracticeScore();
    markPracticeCompleted(score);
  };

  // Функция для нормализации текста - убирает знаки препинания и ударения
  const normalizeText = (text: string): string => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      // Убираем знаки препинания (включая испанские)
      .replace(/[¿¡?!.,;:()]/g, '')
      // Убираем ударения и диакритические знаки
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Убираем лишние пробелы
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getPracticeScore = () => {
    if (!lesson.practice[0]) return 0;
    
    const correctAnswers = lesson.practice[0].items.filter((item, index) => {
      const userAnswer = normalizeText(practiceAnswers[index] || '');
      // Проверяем оба варианта структуры: { es, ru } или { ru, es }
      const correctAnswer = normalizeText((item.es || item.ru) || '');
      return userAnswer === correctAnswer;
    });
    
    return Math.round((correctAnswers.length / lesson.practice[0].items.length) * 100);
  };

  // Обновляем прогресс в родительском компоненте
  useEffect(() => {
    if (onUpdateProgress && progressLoaded) {
      onUpdateProgress(totalProgress);
    }
  }, [totalProgress, onUpdateProgress, progressLoaded]);

  // Extract words from lesson content using dedicated words files
  const extractWordsFromLesson = () => {
    const words: Array<{ term: string; translation: string; english?: string }> = [];

    // Import lesson words dynamically based on lesson ID
    if (lessonId) {
      try {
        // Import words from dedicated lesson words file
        const lessonWords = getLessonWords(lessonId);
        words.push(...lessonWords);
        console.log(`📚 Loaded ${lessonWords.length} words for lesson: ${lessonId}`);
      } catch (error) {
        console.warn(`Failed to load words for lesson ${lessonId}:`, error);
        
        // Fallback: extract from practice section (legacy method)
        lesson.practice.forEach(practice => {
          practice.items.forEach(item => {
            // Проверяем структуру item - может быть { es, ru } или { ru, es }
            const term = item.es || item.ru;
            const translation = item.ru || item.es;
            
            if (term && translation && !words.find(w => w.term === term)) {
              words.push({ term, translation });
            }
          });
        });
      }
    }

    return words;
  };

  const handleAddWordsFromLesson = async () => {
    if (isAddingWords) return;

    setIsAddingWords(true);
    setAddWordsMessage('');

    try {
      const words = extractWordsFromLesson();
      logInfo('📚 Extracted words from lesson:', words.length, 'LessonScreen');

      // Use the new method to add multiple cards with lesson ID
      const result = await CardService.addCardsFromLesson(words, 'ru-es', lessonId);

      setWordsAdded(true);
      setAddWordsMessage(`✅ Добавлено ${result.added} слов${result.skipped > 0 ? `, пропущено ${result.skipped} дубликатов` : ''}`);
      
      // Reload cards to update the context
      try {
        const updatedCards = await CardService.getUserCards();
        logInfo('📚 Cards reloaded after adding lesson words:', updatedCards.length, 'LessonScreen');
        
        // Update the context with new cards
        dispatch({ type: 'SET_CARDS', payload: updatedCards });
        logInfo('📚 Context updated with new cards', null, 'LessonScreen');
        
        // Store lesson ID in localStorage for the session to know which lesson to prioritize
        if (lessonId) {
          localStorage.setItem('currentLessonId', lessonId);
          logInfo('📚 Current lesson ID stored:', lessonId, 'LessonScreen');
        }
      } catch (reloadError) {
        console.error('Error reloading cards:', reloadError);
      }
      
      // Don't reset the state - keep the button changed

    } catch (error) {
      console.error('Error adding words from lesson:', error);
      setAddWordsMessage('❌ Ошибка при добавлении слов');
    } finally {
      setIsAddingWords(false);
    }
  };

  const handleStartLearning = () => {
    if (onStartLearning) {
      onStartLearning();
    }
  };

  const renderTheory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Теория</h2>
          </div>
          
          {/* Add Words Button */}
          <button
            onClick={wordsAdded ? handleStartLearning : handleAddWordsFromLesson}
            disabled={isAddingWords}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
              wordsAdded 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isAddingWords ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Добавляем...
              </>
            ) : wordsAdded ? (
              <>
                <Play className="w-4 h-4" />
                Перейти к изучению слов
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Добавить слова из урока
              </>
            )}
          </button>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
            {lesson.theory}
          </pre>
        </div>
        
        {/* Add Words Message */}
        {addWordsMessage && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            addWordsMessage.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {addWordsMessage}
          </div>
        )}
      </div>
    </div>
  );

  const renderDialogues = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Диалоги</h2>
        </div>

        {lesson.dialogues && lesson.dialogues.map((dialogue, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {dialogue.es.map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-gray-800 font-medium mb-1">{line}</div>
                    <div className="text-gray-600 text-sm">{dialogue.ru[lineIndex]}</div>
                  </div>
                  <button
                    onClick={() => {
                      // Здесь можно добавить воспроизведение аудио
                      console.log('Playing audio for:', line);
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPractice = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Практика</h2>
        </div>

        {lesson.practice[0] && (
          <div className="space-y-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2">{lesson.practice[0].task}</h3>
            </div>

            <div className="space-y-4">
              {lesson.practice[0].items.map((item, index) => {
                // Определяем структуру: { es, ru } или { ru, es }
                const question = item.ru || item.es;
                const correctAnswer = item.es || item.ru;
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">{question}</span>
                      {showPracticeResults && (
                        <div className="flex items-center gap-2">
                          {normalizeText(practiceAnswers[index] || '') === normalizeText(correctAnswer) ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-red-500 text-sm">✗</span>
                              <span className="text-green-600 text-sm font-medium">{correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={practiceAnswers[index] || ''}
                      onChange={(e) => handlePracticeAnswerChange(index, e.target.value)}
                      placeholder="Введите ответ..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={showPracticeResults}
                    />
                  </div>
                );
              })}
            </div>

            {!showPracticeResults ? (
              <button
                onClick={checkPracticeAnswers}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Проверить ответы
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {getPracticeScore()}%
                  </div>
                  <div className="text-gray-600">
                    Правильных ответов: {lesson.practice[0].items.filter((item, index) => {
                      const userAnswer = normalizeText(practiceAnswers[index] || '');
                      const correctAnswer = normalizeText((item.es || item.ru) || '');
                      return userAnswer === correctAnswer;
                    }).length} из {lesson.practice[0].items.length}
                  </div>
                </div>
                
                {/* Add Words Button after practice completion */}
                <div className="text-center">
                  <button
                    onClick={wordsAdded ? handleStartLearning : handleAddWordsFromLesson}
                    disabled={isAddingWords}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 mx-auto ${
                      wordsAdded 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {isAddingWords ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Добавляем...
                      </>
                    ) : wordsAdded ? (
                      <>
                        <Play className="w-4 h-4" />
                        Перейти к изучению слов
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Добавить слова из урока
                      </>
                    )}
                  </button>
                  
                  {/* Add Words Message */}
                  {addWordsMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                      addWordsMessage.includes('✅') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {addWordsMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                <div className="text-sm text-gray-500">
                  Прогресс: {totalProgress}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-8">
          {[
            { id: 'theory', label: 'Теория', icon: BookOpen },
            { id: 'dialogues', label: 'Диалоги', icon: MessageSquare },
            { id: 'practice', label: 'Практика', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === 'theory' && renderTheory()}
        {activeSection === 'dialogues' && renderDialogues()}
        {activeSection === 'practice' && renderPractice()}
      </div>
    </div>
  );
};