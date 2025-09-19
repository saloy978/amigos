import React from 'react';
import { Target, TrendingUp, BookOpen, BarChart3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SpacedRepetitionAdapter } from '../../services/spacedRepetitionAdapter';
import { CardState, UserCardWithContent } from '../../types';
import { AddWordModal } from '../modals/AddWordModal';
import { AIWordGeneratorModal } from '../modals/AIWordGeneratorModal';
import { UserService } from '../../services/userService';
import { CardService } from '../../services/cardService';
import { useStreak } from '../../hooks/useStreak';
import GamesIcon from '../../Assets/Games.png';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: string;
  created_at: Date;
  updated_at: Date;
}

interface HomeScreenProps {
  onStartSession: () => void;
  onManageCards: () => void;
  onViewStats: () => void;
  onProfileClick: () => void;
  onNavigateToCards: (filter: 'learn' | 'review' | 'suspended') => void;
  onNavigateToLessons: () => void;
  onNavigateToSoundHunt: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSession,
  onManageCards,
  onViewStats,
  onProfileClick,
  onNavigateToCards,
  onNavigateToLessons,
  onNavigateToSoundHunt
}) => {
  const { state, dispatch } = useAppContext();

  const [isAddWordModalOpen, setIsAddWordModalOpen] = React.useState(false);
  const [isAIGeneratorModalOpen, setIsAIGeneratorModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  // Streak система
  const {
    currentStreak,
    recordActivity
  } = useStreak(currentUser?.id || '');

  // Load user data from Supabase when component mounts
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoadingUser(true);
        
        // Try to get user from Supabase database first
        let user = await UserService.getCurrentUserFromDB();
        
        // If no user in database, try localStorage as fallback
        if (!user) {
          user = UserService.getCurrentUser();
        }
        
        // If still no user, create one from auth data
        if (!user) {
          user = await UserService.createOrUpdateUserInDB({});
        }
        
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage
        const user = UserService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    loadUserData();
  }, []);

  // Обновляем статусы карточек когда карточки загружаются или изменяются
  React.useEffect(() => {
    if (state.cards.length === 0) {
      return; // Не обновляем, если карточки еще не загружены
    }
    
    // Обновляем статусы карточек на основе времени до показа
    const updatedCards = state.cards.map(card => 
      SpacedRepetitionAdapter.getTimeUntilNext(card) ? card : card
    );
    
    // Обновляем карточки в контексте если есть изменения
    const hasChanges = updatedCards.some((card, index) => 
      card.state !== state.cards[index]?.state
    );
    
    if (hasChanges) {
      dispatch({ type: 'SET_CARDS', payload: updatedCards });
    }
  }, [state.cards, dispatch]);
  
  const dueCards = SpacedRepetitionAdapter.getDueCards(state.cards);
  const nextDueCard = SpacedRepetitionAdapter.getNextDueCard(state.cards);
  
  // Обновляем состояние карточек на основе прогресса и времени до повторения
  const cardsWithUpdatedStates = state.cards.map(card => {
    const updatedCard = { ...card };
    const now = new Date();
    
    // Если карточка просрочена (dueAt <= now), она должна быть изучена
    if (card.dueAt <= now) {
      updatedCard.state = CardState.LEARN; // Учить (просроченные карточки)
    } else if (card.progress >= 10 && card.progress < 70) {
      updatedCard.state = CardState.REVIEW; // Знаю (прогресс 10-69%, интервал не подошел)
    } else {
      updatedCard.state = CardState.SUSPENDED; // Выучено (прогресс 70-100%)
    }
    return updatedCard;
  });

  const learnCards = cardsWithUpdatedStates.filter(card => card.state === CardState.LEARN).length;
  const reviewCards = cardsWithUpdatedStates.filter(card => card.state === CardState.REVIEW).length;
  const suspendedCards = cardsWithUpdatedStates.filter(card => card.state === CardState.SUSPENDED).length;
  
  // Для совместимости со старым кодом
  const knownCards = reviewCards;
  const masteredCards = suspendedCards;
  
  const totalProgress = state.cards.length > 0 
    ? Math.round(state.cards.reduce((sum, card) => sum + card.progress, 0) / state.cards.length)
    : 0;

  const formatTimeUntil = (userCard: UserCardWithContent): string => {
    return SpacedRepetitionAdapter.getTimeUntilNext(userCard);
  };

  const handleAddWord = async (cardData: any) => {
    try {
      // Save card to database using new method
      const newCard = await CardService.addCardToUser(
        cardData.term,
        cardData.translation,
        cardData.languagePairId || 'ru-es',
        cardData.imageUrl,
        cardData.english
      );
      
      if (newCard) {
        dispatch({ type: 'ADD_CARD', payload: newCard });
        
        // Обновляем статистику пользователя после добавления карточки
        const updatedCards = [...state.cards, newCard];
        const masteredCards = updatedCards.filter(card => card.progress >= 70).length;
        const learnedCards = updatedCards.filter(card => card.progress >= 50).length;
        const dueCards = SpacedRepetitionAdapter.getDueCards(updatedCards);
        
        dispatch({
          type: 'UPDATE_USER_STATS',
          payload: {
            totalCards: updatedCards.length,
            learnedCards,
            masteredCards,
            reviewsDue: dueCards.length
          }
        });
      }
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Ошибка при добавлении карточки');
    }
  };

  const handleStartSession = async () => {
    await recordActivity();
    onStartSession();
  };

  const handleAddAIWords = async (cardsData: any[]) => {
    console.log('🏠 HomeScreen: Received cards from AI:', cardsData.length);
    console.log('🏠 HomeScreen: Cards data:', cardsData);
    console.log('🏠 HomeScreen: Current cards count before adding:', state.cards.length);
    
    try {
      // Save all cards to database using new method
      const newCards = await Promise.all(
        cardsData.map(cardData => 
          CardService.addCardToUser(
            cardData.term,
            cardData.translation,
            cardData.languagePairId || 'ru-es',
            cardData.imageUrl,
            cardData.english
          )
        )
      );
      
      newCards.forEach(card => {
        if (card) {
          dispatch({ type: 'ADD_CARD', payload: card });
        }
      });
      
      // Обновляем статистику пользователя после добавления карточек
      const validNewCards = newCards.filter(c => c !== null) as UserCardWithContent[];
      const updatedCards = [...state.cards, ...validNewCards];
      const masteredCards = updatedCards.filter(card => card.progress >= 70).length;
      const learnedCards = updatedCards.filter(card => card.progress >= 50).length;
      const dueCards = SpacedRepetitionAdapter.getDueCards(updatedCards);
      
      dispatch({
        type: 'UPDATE_USER_STATS',
        payload: {
          totalCards: updatedCards.length,
          learnedCards,
          masteredCards,
          reviewsDue: dueCards.length
        }
      });
      
      console.log(`✅ Successfully added ${newCards.filter(c => c).length} cards to database`);
    } catch (error) {
      console.error('Error adding AI cards:', error);
      alert('Ошибка при добавлении карточек');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-md mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
        {/* Header with greeting and profile */}
        <div className="px-4 pb-6 pt-1.5">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {isLoadingUser ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                  </div>
                ) : (
                  `Привет, ${currentUser?.name || 'Пользователь'} 👋`
                )}
              </h1>
              <button 
                onClick={onViewStats}
                className="flex items-center gap-2 mt-2 hover:bg-orange-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-orange-500" />
                <span className="text-gray-700 font-medium">{currentStreak} дней подряд</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1">
                <button
                  onClick={onProfileClick}
                  className="w-full h-full rounded-full flex items-center justify-center"
                >
                  <img 
                    src={currentUser?.avatar_url || '/assets/Foto.png'} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
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
            <div 
              className="bg-white rounded-2xl p-4 border-2 border-orange-200 text-center cursor-pointer hover:bg-orange-50 transition-colors"
              onClick={() => onNavigateToCards('learn')}
            >
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-0">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-500">{learnCards}</div>
              <div className="text-1xl font-bold text-orange-500">Учить</div>
            </div>
            
            <div 
              className="bg-white rounded-2xl p-4 border-2 border-blue-200 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => onNavigateToCards('review')}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-0">
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-500">{knownCards}</div>
              <div className="text-1xl font-bold text-blue-500">Знаю</div>
            </div>
            
            <div 
              className="bg-white rounded-2xl p-4 border-2 border-green-200 text-center cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => onNavigateToCards('suspended')}
            >
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
              onClick={handleStartSession}
              className="mx-auto w-80 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-full font-bold text-lg flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-lg mb-6"
            >
              <div>НАЧАТЬ</div>
              <div>повторить слова</div>
            </button>
          ) : (
            <div className="text-center py-8 mb-6">
              <button
                onClick={() => setIsAIGeneratorModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 mx-auto mb-4"
              >
                <span></span>
                Добавить слова
              </button>
              <h3 className="font-medium text-gray-900 mb-1">Пока нечего повторять</h3>
              {nextDueCard ? (
                <p className="text-sm text-gray-600">
                  Следующая карточка появиться {formatTimeUntil(nextDueCard)}
                </p>
              ) : (
                <p className="text-sm text-gray-600">Добавьте новые слова</p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="grid grid-cols-3 gap-4 px-4 mb-8">
            <button
              onClick={onNavigateToLessons}
              className="flex flex-col items-center py-3 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src="/assets/Lesson.png" alt="Уроки" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Уроки</span>
            </button>
            <button
              onClick={onManageCards}
              className="flex flex-col items-center py-3 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src="/assets/Cards_array.png" alt="Карточки" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Карточки</span>
            </button>
            <button
              onClick={onNavigateToSoundHunt}
              className="flex flex-col items-center py-3 px-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <img src={GamesIcon} alt="Игры" className="w-12 h-12 mb-2" />
              <span className="text-sm font-medium">Игры</span>
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