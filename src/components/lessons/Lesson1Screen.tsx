import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Volume2, BookOpen, MessageSquare, Trophy, RotateCcw, Download, Target } from 'lucide-react';
import { lesson1Content, lesson1Games } from '../../context/lessons/lesson1';
import { GameItem, PluralGameItem, GameScore } from '../../types';
import { CardService } from '../../services/cardService';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { useTheoryTracking } from '../../hooks/useTheoryTracking';
import { useDialoguesTracking } from '../../hooks/useDialoguesTracking';
import { getLessonWords } from '../../context/lessons/words/index';

interface Lesson1ScreenProps {
  lessonId?: string;
  onBack: () => void;
  onUpdateProgress?: (progress: number) => void;
}

type GameType = 'gender' | 'plural' | 'sort' | 'findError';
type LessonSection = 'theory' | 'dialogues' | 'practice';

export const Lesson1Screen: React.FC<Lesson1ScreenProps> = ({ lessonId, onBack, onUpdateProgress }) => {
  const [activeSection, setActiveSection] = useState<LessonSection>('theory');
  const [currentGame, setCurrentGame] = useState<GameType>('gender');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isAddingWords, setIsAddingWords] = useState(false);
  const [wordsAdded, setWordsAdded] = useState(false);
  const [addWordsMessage, setAddWordsMessage] = useState('');
  
  // Универсальная система отслеживания прогресса
  const {
    totalProgress,
    progressLoaded,
    markTheoryViewed,
    markDialoguesListened
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

  // Обновляем прогресс в родительском компоненте
  useEffect(() => {
    if (onUpdateProgress && progressLoaded) {
      onUpdateProgress(totalProgress);
    }
  }, [totalProgress, onUpdateProgress, progressLoaded]);

  const getCurrentGameData = () => {
    switch (currentGame) {
      case 'gender':
        return lesson1Games.gender.items;
      case 'plural':
        return lesson1Games.plural.items;
      case 'sort':
        return lesson1Games.sort.items;
      case 'findError':
        return lesson1Games.findError.items;
      default:
        return [];
    }
  };

  const nextQuestion = () => {
    const gameData = getCurrentGameData();
    if (currentQuestion < gameData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Переходим к следующей игре
      const games: GameType[] = ['gender', 'plural', 'sort', 'findError'];
      const currentIndex = games.indexOf(currentGame);
      
      if (currentIndex < games.length - 1) {
        setCurrentGame(games[currentIndex + 1]);
        setCurrentQuestion(0);
        setShowFeedback(false);
        setIsCorrect(false);
      } else {
        // Все игры завершены, переходим к результатам
        setActiveSection('practice');
      }
    }
  };

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
        
        // Fallback: use hardcoded words (legacy method)
        const theoryWords = [
          { term: 'chico', translation: 'мальчик' },
          { term: 'amigo', translation: 'друг' },
          { term: 'hermano', translation: 'брат' },
          { term: 'libro', translation: 'книга' },
          { term: 'alumno', translation: 'ученик' },
          { term: 'museo', translation: 'музей' },
          { term: 'chica', translation: 'девочка' },
          { term: 'amiga', translation: 'подруга' },
          { term: 'hermana', translation: 'сестра' },
          { term: 'casa', translation: 'дом' },
          { term: 'alumna', translation: 'ученица' },
          { term: 'playa', translation: 'пляж' },
          { term: 'papá', translation: 'папа' },
          { term: 'día', translation: 'день' },
          { term: 'policía', translation: 'полицейский' },
          { term: 'mano', translation: 'рука' },
          { term: 'radio', translation: 'радио' },
          { term: 'problema', translation: 'проблема' },
          { term: 'programa', translation: 'программа' },
          { term: 'tema', translation: 'тема' },
          { term: 'planeta', translation: 'планета' },
          { term: 'padre', translation: 'отец' },
          { term: 'café', translation: 'кофе' },
          { term: 'coche', translation: 'автомобиль' },
          { term: 'hombre', translation: 'человек / мужчина' },
          { term: 'madre', translation: 'мать' },
          { term: 'calle', translation: 'улица' },
          { term: 'noche', translation: 'ночь' },
          { term: 'tarde', translation: 'вечер / день' },
          { term: 'amor', translation: 'любовь' },
          { term: 'sol', translation: 'солнце' },
          { term: 'avión', translation: 'самолет' },
          { term: 'lápiz', translation: 'карандаш' },
          { term: 'país', translation: 'страна' },
          { term: 'césped', translation: 'газон' },
          { term: 'flor', translation: 'цветок' },
          { term: 'sal', translation: 'соль' },
          { term: 'operación', translation: 'операция' },
          { term: 'luz', translation: 'свет' },
          { term: 'crisis', translation: 'кризис' },
          { term: 'pared', translation: 'стена' },
          { term: 'estación', translation: 'станция' },
          { term: 'ciudad', translation: 'город' },
          { term: 'cuestión', translation: 'вопрос' },
          { term: 'verdad', translation: 'правда' },
          { term: 'pensión', translation: 'пенсия' },
          { term: 'felicidad', translation: 'счастье' },
          { term: 'estudiante', translation: 'студент/студентка' },
          { term: 'cliente', translation: 'клиент/клиентка' },
          { term: 'economista', translation: 'экономист' }
        ];
        words.push(...theoryWords);
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
      console.log('📚 Extracted words from lesson:', words.length);

      // Use the new method to add multiple cards
      const result = await CardService.addCardsFromLesson(words, 'ru-es');

      setWordsAdded(true);
      setAddWordsMessage(`✅ Добавлено ${result.added} слов${result.skipped > 0 ? `, пропущено ${result.skipped} дубликатов` : ''}`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setWordsAdded(false);
        setAddWordsMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error adding words from lesson:', error);
      setAddWordsMessage('❌ Ошибка при добавлении слов');
    } finally {
      setIsAddingWords(false);
    }
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

  const checkAnswer = (answer: string) => {
    const gameData = getCurrentGameData();
    const currentItem = gameData[currentQuestion];
    
    let correct = false;
    if (currentGame === 'gender') {
      correct = answer === (currentItem as GameItem).answer;
    } else if (currentGame === 'plural') {
      correct = normalizeText(answer) === normalizeText((currentItem as PluralGameItem).plural);
    }
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Обновляем счет
    const newScores = [...scores];
    if (!newScores[currentQuestion]) {
      newScores[currentQuestion] = { correct: 0, total: 0, percentage: 0 };
    }
    
    if (correct) {
      newScores[currentQuestion].correct++;
    }
    newScores[currentQuestion].total++;
    newScores[currentQuestion].percentage = Math.round(
      (newScores[currentQuestion].correct / newScores[currentQuestion].total) * 100
    );
    
    setScores(newScores);
    
    // Сохраняем ответ пользователя
    setUserAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
    
    // Автоматически переходим к следующему вопросу через 2 секунды
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const resetGame = () => {
    setCurrentGame('gender');
    setCurrentQuestion(0);
    setScores([]);
    setUserAnswers({});
    setShowFeedback(false);
    setIsCorrect(false);
    setGameCompleted(false);
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
            onClick={handleAddWordsFromLesson}
            disabled={isAddingWords}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
              wordsAdded 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
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
                <CheckCircle className="w-4 h-4" />
                Слова добавлены
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
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
            {lesson1Content.theory}
          </div>
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

        {lesson1Content.dialogues && lesson1Content.dialogues.map((dialogue, index) => (
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

  const renderGame = () => {
    const gameData = getCurrentGameData();
    const currentItem = gameData[currentQuestion];

    if (!currentItem) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentGame === 'gender' && 'Определите род'}
                {currentGame === 'plural' && 'Образуйте множественное число'}
                {currentGame === 'sort' && 'Сортировка по роду'}
                {currentGame === 'findError' && 'Найдите ошибку'}
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              Вопрос {currentQuestion + 1} из {gameData.length}
            </div>
          </div>

          <div className="text-center space-y-6">
            {currentGame === 'gender' && (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  {(currentItem as GameItem).term}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => checkAnswer('m')}
                    disabled={showFeedback}
                    className={`px-8 py-4 rounded-lg font-medium text-lg transition-colors ${
                      showFeedback && isCorrect && userAnswers[currentQuestion] === 'm'
                        ? 'bg-green-500 text-white'
                        : showFeedback && !isCorrect && userAnswers[currentQuestion] === 'm'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    🚹 Masculino
                  </button>
                  <button
                    onClick={() => checkAnswer('f')}
                    disabled={showFeedback}
                    className={`px-8 py-4 rounded-lg font-medium text-lg transition-colors ${
                      showFeedback && isCorrect && userAnswers[currentQuestion] === 'f'
                        ? 'bg-green-500 text-white'
                        : showFeedback && !isCorrect && userAnswers[currentQuestion] === 'f'
                        ? 'bg-red-500 text-white'
                        : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    }`}
                  >
                    🚺 Femenino
                  </button>
                </div>
                
                {showFeedback && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="font-medium">
                      {isCorrect ? '✅ Правильно!' : '❌ Неправильно'}
                    </div>
                    <div className="text-sm mt-1">
                      Правильный ответ: <strong>{(currentItem as GameItem).answer === 'm' ? 'Masculino' : 'Femenino'}</strong>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentGame === 'plural' && (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  {(currentItem as PluralGameItem).singular}
                </div>
                
                <div className="max-w-md mx-auto">
                  <input
                    type="text"
                    value={userAnswers[currentQuestion] || ''}
                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer(userAnswers[currentQuestion] || '')}
                    placeholder="Введите множественную форму..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={showFeedback}
                  />
                </div>
                
                <button
                  onClick={() => checkAnswer(userAnswers[currentQuestion] || '')}
                  disabled={showFeedback || !userAnswers[currentQuestion]}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                  Проверить
                </button>
                
                {showFeedback && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="font-medium">
                      {isCorrect ? '✅ Правильно!' : '❌ Неправильно'}
                    </div>
                    <div className="text-sm mt-1">
                      Правильный ответ: <strong>{(currentItem as PluralGameItem).plural}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPractice = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Результаты</h2>
          </div>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Начать заново
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['gender', 'plural', 'sort', 'findError'].map((game, index) => {
            const gameData = getCurrentGameData();
            const gameScores = scores.filter((_, i) => Math.floor(i / gameData.length) === index);
            const totalCorrect = gameScores.reduce((sum, score) => sum + score.correct, 0);
            const totalQuestions = gameScores.reduce((sum, score) => sum + score.total, 0);
            const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

            return (
              <div key={game} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">
                  {game === 'gender' && 'Род'}
                  {game === 'plural' && 'Множественное число'}
                  {game === 'sort' && 'Сортировка'}
                  {game === 'findError' && 'Поиск ошибок'}
                </div>
                <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
                <div className="text-xs text-gray-500">{totalCorrect}/{totalQuestions}</div>
              </div>
            );
          })}
        </div>

        {/* Add Words Button after practice completion */}
        <div className="text-center">
          <button
            onClick={handleAddWordsFromLesson}
            disabled={isAddingWords}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 mx-auto ${
              wordsAdded 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
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
                <CheckCircle className="w-4 h-4" />
                Слова добавлены
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
                <h1 className="text-2xl font-bold text-gray-900">{lesson1Content.title}</h1>
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
        {activeSection === 'practice' && (gameCompleted ? renderPractice() : renderGame())}
      </div>
    </div>
  );
};