import React, { useState, useEffect } from 'react';
import { CardDisplay } from './CardDisplay';
import { SessionProgress } from './SessionProgress';
import { AddWordModal } from '../modals/AddWordModal';
import { CardDisplaySettingsModal } from '../modals/CardDisplaySettingsModal';
import { Home, Trash2, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SpacedRepetitionAdapter } from '../../services/spacedRepetitionAdapter';
import { ReviewResult, DisplayMode, ReviewDirection, UserCardWithContent } from '../../types';
import { UserService } from '../../services/userService';
import { CardService } from '../../services/cardService';
import { useCardDisplaySettings } from '../../hooks/useCardDisplaySettings';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: string;
  created_at: Date;
  updated_at: Date;
}

interface SessionScreenProps {
  onEndSession: () => void;
  onProfileClick?: () => void;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({ onEndSession, onProfileClick }) => {
  const { state, dispatch } = useAppContext();
  const { getDisplayMode, openSettingsModal, isModalOpen, closeSettingsModal, handleSaveSettings } = useCardDisplaySettings();
  const [sessionStartTime] = useState(new Date());
  const [currentDisplayMode, setCurrentDisplayMode] = useState<DisplayMode>(DisplayMode.WORD);
  const [currentDirection, setCurrentDirection] = useState<ReviewDirection>(ReviewDirection.KNOWN_TO_LEARNING);
  const [sessionPoints, setSessionPoints] = useState(128);
  const [pointsGained, setPointsGained] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user data from Supabase when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
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
      }
    };
    
    loadUserData();
  }, []);

  useEffect(() => {
    // Get next card when session starts or current card is updated
    if (!state.currentCard) {
      // Try to get the current lesson ID from localStorage first, then from recent cards
      let currentLessonId = localStorage.getItem('currentLessonId') || undefined;
      
      if (!currentLessonId) {
        const recentLessonCards = state.cards
          .filter(card => (card as any).lessonId && (card as any).lessonOrder !== null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        currentLessonId = recentLessonCards.length > 0 ? (recentLessonCards[0] as any).lessonId : undefined;
      }
      
      // Use the new logic that prioritizes lesson order for new cards
      const nextCard = SpacedRepetitionAdapter.getNextCardToShow(state.cards, currentLessonId);
      
      if (nextCard) {
        dispatch({ type: 'SET_CURRENT_CARD', payload: nextCard });
        
        // Set display mode and direction based on card progress
        const displayMode = getDisplayMode(nextCard.progress, nextCard.reviewCount) as DisplayMode;
        const direction = SpacedRepetitionAdapter.getReviewDirection(nextCard);
        
        setCurrentDisplayMode(displayMode);
        setCurrentDirection(direction);
      } else {
        // No more cards to review
        // Clear the current lesson ID if we were studying lesson cards
        const currentLessonId = localStorage.getItem('currentLessonId');
        if (currentLessonId) {
          console.log('🎯 Finished studying lesson cards, clearing currentLessonId');
          localStorage.removeItem('currentLessonId');
        }
        handleEndSession();
      }
    }
  }, [state.currentCard, state.cards]);

  const handleCardReview = async (result: ReviewResult) => {
    if (!state.currentCard) return;

    // Add points for correct answers
    if (result.correct) {
      const points = 10;
      setPointsGained(points);
      setSessionPoints(prev => prev + points);
      
      // Show points animation
      setTimeout(() => setPointsGained(0), 2000);
    }

    // Process the review and update the card
    const updatedCard = SpacedRepetitionAdapter.processReview(state.currentCard, result);
    
    // Update session stats first
    dispatch({
      type: 'UPDATE_SESSION_STATS',
      payload: {
        cardsReviewed: state.sessionStats.cardsReviewed + 1,
        correctAnswers: state.sessionStats.correctAnswers + (result.correct ? 1 : 0),
        timeSpent: state.sessionStats.timeSpent + result.timeSpent
      }
    });

    // Update card in memory immediately
    dispatch({ type: 'UPDATE_CARD', payload: updatedCard });

    // Clear current card to trigger loading of next card
    dispatch({ type: 'SET_CURRENT_CARD', payload: null });

    // Save to database in background (don't wait for it)
    CardService.updateUserCard(updatedCard)
      .then(savedCard => {
        // Update with the saved version from database
        dispatch({ type: 'UPDATE_CARD', payload: savedCard });
      })
      .catch(error => {
        console.error('Error updating card after review:', error);
        // Card is already updated in memory, so we don't need to do anything
      });
  };

  const handleEndSession = () => {
    const sessionTime = new Date().getTime() - sessionStartTime.getTime();
    const sessionTimeMinutes = Math.floor(sessionTime / 60000);

    // Update user stats
    const masteredCards = state.cards.filter(card => card.progress >= 70).length;
    const learnedCards = state.cards.filter(card => card.progress >= 50).length;
    const dueCards = SpacedRepetitionAdapter.getDueCards(state.cards);

    dispatch({
      type: 'UPDATE_USER_STATS',
      payload: {
        totalCards: state.cards.length,
        learnedCards,
        masteredCards,
        reviewsDue: dueCards.length,
        lastSessionDate: new Date()
      }
    });

    dispatch({ type: 'END_SESSION' });
    onEndSession();
  };

  const handleEditCard = async (cardData: Omit<UserCardWithContent, 'userId' | 'cardId' | 'createdAt' | 'updatedAt'>) => {
    if (!state.currentCard) return;
    
    try {
      console.log('🔄 SessionScreen: handleEditCard called');
      console.log('🔄 SessionScreen: Card ID:', state.currentCard.cardId);
      console.log('🔄 SessionScreen: New data:', {
        term: cardData.term,
        translation: cardData.translation,
        imageUrl: cardData.imageUrl,
        english: cardData.english
      });
      
      // Update card content in the database
      console.log('🔄 SessionScreen: Calling CardService.updateCardContent...');
      await CardService.updateCardContent(
        state.currentCard.cardId,
        cardData.term,
        cardData.translation,
        cardData.imageUrl,
        cardData.english
      );
      console.log('✅ SessionScreen: CardService.updateCardContent completed');
      
      // Update the card in the local state
      const updatedCard = {
        ...state.currentCard,
        term: cardData.term.trim(),
        translation: cardData.translation.trim(),
        imageUrl: cardData.imageUrl?.trim() || undefined,
        english: cardData.english?.trim() || undefined,
        updatedAt: new Date()
      };
      console.log('🔄 SessionScreen: Updated card object:', updatedCard);
      
      // Update the card in the context
      console.log('🔄 SessionScreen: Dispatching UPDATE_CARD action...');
      dispatch({ type: 'UPDATE_CARD', payload: updatedCard });
      dispatch({ type: 'SET_CURRENT_CARD', payload: updatedCard });
      console.log('✅ SessionScreen: UPDATE_CARD action dispatched');
      
      console.log('✅ SessionScreen: Card updated successfully');
      
      // Reload cards to get updated data (in case of merge)
      console.log('🔄 SessionScreen: Reloading cards to get updated data...');
      const updatedCards = await CardService.getUserCards();
      dispatch({ type: 'SET_CARDS', payload: updatedCards });
      console.log('✅ SessionScreen: Cards reloaded:', updatedCards.length);
      
      setIsEditModalOpen(false);
      console.log('✅ SessionScreen: Modal closed');
    } catch (error) {
      console.error('❌ SessionScreen: Error updating card:', error);
      console.error('❌ SessionScreen: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ SessionScreen: Alert error message:', errorMessage);
      
      alert('Ошибка при сохранении изменений карточки: ' + errorMessage);
    }
  };

  const handleAddCard = async (cardData: Omit<UserCardWithContent, 'userId' | 'cardId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCard = await CardService.addCardToUser(
        cardData.term,
        cardData.translation,
        cardData.languagePairId || 'ru-es',
        cardData.imageUrl,
        cardData.english
      );
      
      if (newCard) {
        dispatch({ type: 'ADD_CARD', payload: newCard });
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Ошибка при добавлении карточки');
    }
  };

  const handleDeleteCard = () => {
    if (!state.currentCard) return;
    
    if (showDeleteConfirm) {
      CardService.removeCardFromUser(state.currentCard.cardId)
        .then(() => {
          // Remove the card from the cards array
          const updatedCards = state.cards.filter(card => card.cardId !== state.currentCard!.cardId);
          
          // Update the cards in the context
          dispatch({ type: 'SET_CARDS', payload: updatedCards });
          
          // Clear current card to load next one
          dispatch({ type: 'SET_CURRENT_CARD', payload: null });
          
          // Reset confirmation state
          setShowDeleteConfirm(false);
        })
        .catch(error => {
          console.error('Error deleting card:', error);
          alert('Ошибка при удалении карточки');
          setShowDeleteConfirm(false);
        });
    } else {
      // Show confirmation
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };
  const totalDueCards = SpacedRepetitionAdapter.getDueCards(state.cards).length;
  const remainingCards = totalDueCards - state.sessionStats.cardsReviewed;

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-md mx-auto bg-gray-200 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEndSession}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-6 h-6" />
            </button>
            <button
              onClick={openSettingsModal}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="Настройки отображения карточек"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              Балы {sessionPoints} 🔥
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            {currentUser?.avatar_url ? (
              <button
                onClick={onProfileClick}
                className="w-full h-full rounded-full overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img 
                  src={currentUser?.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              </button>
            ) : (
              <button
                onClick={onProfileClick}
                className="w-full h-full rounded-full flex items-center justify-center text-white text-lg font-bold hover:opacity-80 transition-opacity"
              >
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-4 relative">
          {state.currentCard ? (
            <div className="w-full flex flex-col items-center">
              <CardDisplay
                card={state.currentCard}
                displayMode={currentDisplayMode}
                direction={currentDirection}
                onReview={handleCardReview}
              />
              
              {/* Management buttons - positioned right under the answer buttons */}
              <div className="w-full max-w-sm mt-6">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-3 bg-transparent hover:bg-white/10 rounded-2xl transition-all transform hover:scale-105"
                    disabled={!state.currentCard}
                  >
                    <img 
                      src="/assets/Edit.png" 
                      alt="Редактировать" 
                      className="w-8 h-8 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<span class="text-blue-600 text-xl">✏️</span>';
                      }}
                    />
                  </button>
                  
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-3 bg-transparent hover:bg-white/10 rounded-2xl transition-all transform hover:scale-105"
                  >
                    <img 
                      src="/assets/Add.png" 
                      alt="Добавить" 
                      className="w-8 h-8 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<span class="text-green-600 text-xl">➕</span>';
                      }}
                    />
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={handleDeleteCard}
                      className={`p-3 bg-transparent hover:bg-white/10 rounded-2xl transition-all transform hover:scale-105 ${
                        showDeleteConfirm ? 'animate-pulse' : ''
                      }`}
                      disabled={!state.currentCard}
                    >
                      <img 
                        src="/assets/Delete.png" 
                        alt="Удалить" 
                        className="w-8 h-8 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<span class="text-red-600 text-xl">🗑️</span>';
                        }}
                      />
                    </button>
                    {showDeleteConfirm && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium animate-pulse whitespace-nowrap">
                        Подтвердить
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Загружаем следующую карточку...</p>
            </div>
          )}
        </div>

        {/* Edit Word Modal */}
        <AddWordModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditCard}
          editCard={state.currentCard}
          existingCards={state.cards}
        />

        {/* Add Word Modal */}
        <AddWordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddCard}
          existingCards={state.cards}
        />

        {/* Card Display Settings Modal */}
        <CardDisplaySettingsModal
          isOpen={isModalOpen}
          onClose={closeSettingsModal}
          onSave={handleSaveSettings}
        />

      </div>

    </div>
  );
};