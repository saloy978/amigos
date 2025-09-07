import React from 'react';
import { Play, Target, Calendar, TrendingUp, User, BookOpen, BarChart3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SpacedRepetitionService } from '../../services/spacedRepetition';
import { CardState } from '../../types';
import { AddWordModal } from '../modals/AddWordModal';
import { AIWordGeneratorModal } from '../modals/AIWordGeneratorModal';
import { Card } from '../../types';
import { UserService } from '../../services/userService';
import { DatabaseService } from '../../services/database';
import { CardService } from '../../services/cardService';

interface HomeScreenProps {
  onStartSession: () => void;
  onManageCards: () => void;
  onViewStats: () => void;
  onProfileClick: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSession,
  onManageCards,
  onViewStats,
  onProfileClick
}) => {
  const { state, dispatch } = useAppContext();
  const [isAddWordModalOpen, setIsAddWordModalOpen] = React.useState(false);
  const [isAIGeneratorModalOpen, setIsAIGeneratorModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(() => {
    return UserService.getCurrentUser();
  });
  const [languageSettings, setLanguageSettings] = React.useState(() => {
    return UserService.getUserSettings() || DatabaseService.getLanguagePair();
  });

  // Update user data when component mounts
  React.useEffect(() => {
    const user = UserService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    
    const settings = UserService.getUserSettings() || DatabaseService.getLanguagePair();
    if (settings) {
      setLanguageSettings(settings);
    }
    
    // Обновляем статусы карточек на основе времени до показа
    const updatedCards = state.cards.map(card => 
      SpacedRepetitionService.updateCardStateBasedOnDueTime(card)
    );
    
    // Обновляем карточки в контексте если есть изменения
    const hasChanges = updatedCards.some((card, index) => 
      card.state !== state.cards[index]?.state
    );
    
    if (hasChanges) {
      dispatch({ type: 'SET_CARDS', payload: updatedCards });
    }
  }, []);
  
  const dueCards = SpacedRepetitionService.getDueCards(state.cards);
  const nextDueCard = SpacedRepetitionService.getNextDueCard(state.cards);
  
  const learnCards = state.cards.filter(card => card.state === CardState.LEARN).length;
  const knownCards = state.cards.filter(card => card.state === CardState.KNOW).length;
  const masteredCards = state.cards.filter(card => card.state === CardState.MASTERED).length;
  
  const totalProgress = state.cards.length > 0 
    ? Math.round(state.cards.reduce((sum, card) => sum + card.progress, 0) / state.cards.length)
    : 0;

  const formatTimeUntil = (date: Date): string => {
    return SpacedRepetitionService.getTimeUntilNext({ dueAt: date } as Card);
  };

  const handleAddWord = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Save card to database
    CardService.createCard(cardData)
      .then(newCard => {
        dispatch({ type: 'ADD_CARD', payload: newCard });
      })
      .catch(error => {
        console.error('Error adding card:', error);
        alert('Ошибка при добавлении карточки');
      });
  };

  const handleAddAIWords = (cardsData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    console.log('🏠 HomeScreen: Received cards from AI:', cardsData.length);
    console.log('🏠 HomeScreen: Cards data:', cardsData);
    console.log('🏠 HomeScreen: Current cards count before adding:', state.cards.length);
    
    // Save all cards to database
    Promise.all(cardsData.map(cardData => CardService.createCard(cardData)))
      .then(newCards => {
        newCards.forEach(card => {
          dispatch({ type: 'ADD_CARD', payload: card });
        });
        console.log(`✅ Successfully added ${newCards.length} cards to database`);
      })
      .catch(error => {
        console.error('Error adding AI cards:', error);
        alert('Ошибка при добавлении карточек');
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
        {/* Header with greeting and profile */}
        <div className="px-4 pb-6 pt-1.5">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Привет, {currentUser.name} 👋
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">🔥</span>
                <span className="text-gray-700 font-medium">{state.userStats.streak} дней подряд</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1">
                <button
                  onClick={onProfileClick}
                  className="w-full h-full rounded-full flex items-center justify-center"
                >
                  {currentUser.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              <span className="text-xs text-gray-500">Профиль</span>
            </div>
          </div>

          {/* Illustration area */}
          <div className="relative">
            <div className="bg-transparent overflow-hidden relative">
              <img 
                src="/assets/intro-3.png" 
                alt="Learning illustration" 
                className="w-full h-64 object-contain"
              />
            </div>
          </div>

          {/* Progress section */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Сегодня прогресс <span className="text-green-600">{totalProgress}%</span>
            </h3>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-0">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-500">{learnCards}</div>
              <div className="text-1xl font-bold text-orange-500">Учить</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border-2 border-blue-200 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-0">
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-500">{knownCards}</div>
              <div className="text-1xl font-bold text-blue-500">Знаю</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border-2 border-green-200 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-0">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">{masteredCards}</div>
              <div className="text-1xl font-bold text-green-500">Выучено</div>
            </div>
          </div>

          {/* Main action button */}
          {dueCards.length > 0 ? (
            <button
              onClick={onStartSession}
              className="mx-auto w-80 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-full font-bold text-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-lg mb-8"
            >
              <div>НАЧАТЬ</div>
              <div>повторить слова</div>
            </button>
          ) : (
            <div className="text-center py-8 mb-8">
              <button
                onClick={() => setIsAIGeneratorModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 mx-auto mb-4"
              >
                <span>✨</span>
                Добавить 10 слов с ИИ
              </button>
              <h3 className="font-medium text-gray-900 mb-1">Пока нечего повторять</h3>
              {nextDueCard ? (
                <p className="text-sm text-gray-600">
                  Следующая карточка через {formatTimeUntil(nextDueCard.dueAt)}
                </p>
              ) : (
                <p className="text-sm text-gray-600">Добавьте новые слова</p>
              )}
              <button
                onClick={() => setIsAddWordModalOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Добавить слово
              </button>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-transparent backdrop-blur-sm">
          <div className="grid grid-cols-3 py-1">
            <button
              onClick={onStartSession}
              className="flex flex-col items-center py-1 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src="/assets/Lesson.png" alt="Уроки" className="w-12 h-12 mb-0" />
              <span className="text-xs">Уроки</span>
            </button>
            <button
              onClick={onManageCards}
              className="flex flex-col items-center py-1 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src="/assets/Cards_array.png" alt="Карточки" className="w-12 h-12 mb-0" />
              <span className="text-xs">Карточки</span>
            </button>
            <button
              onClick={onViewStats}
              className="flex flex-col items-center py-1 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src="/assets/stat.png" alt="Статистика" className="w-12 h-12 mb-0" />
              <span className="text-xs">Статистика</span>
            </button>
          </div>
          
        
        </div>

        {/* Add Word Modal */}
        <AddWordModal
          isOpen={isAddWordModalOpen}
          onClose={() => setIsAddWordModalOpen(false)}
          onSave={handleAddWord}
        />

        {/* AI Word Generator Modal */}
        <AIWordGeneratorModal
          isOpen={isAIGeneratorModalOpen}
          onClose={() => setIsAIGeneratorModalOpen(false)}
          onSave={handleAddAIWords}
          existingCards={state.cards}
        />
      </div>
    </div>
  );
};