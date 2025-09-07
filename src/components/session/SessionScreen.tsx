import React, { useState, useEffect } from 'react';
import { CardDisplay } from './CardDisplay';
import { SessionProgress } from './SessionProgress';
import { AddWordModal } from '../modals/AddWordModal';
import { Home, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SpacedRepetitionService } from '../../services/spacedRepetition';
import { ReviewResult, DisplayMode, ReviewDirection, Card } from '../../types';
import { UserService } from '../../services/userService';
import { CardService } from '../../services/cardService';

interface SessionScreenProps {
  onEndSession: () => void;
  onProfileClick?: () => void;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({ onEndSession, onProfileClick }) => {
  const { state, dispatch } = useAppContext();
  const [sessionStartTime] = useState(new Date());
  const [currentDisplayMode, setCurrentDisplayMode] = useState<DisplayMode>(DisplayMode.WORD);
  const [currentDirection, setCurrentDirection] = useState<ReviewDirection>(ReviewDirection.KNOWN_TO_LEARNING);
  const [sessionPoints, setSessionPoints] = useState(128);
  const [pointsGained, setPointsGained] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser] = useState(() => {
    return UserService.getCurrentUser();
  });

  useEffect(() => {
    // Get next due card when session starts or current card is updated
    if (!state.currentCard) {
      const dueCards = SpacedRepetitionService.getDueCards(state.cards);
      if (dueCards.length > 0) {
        const nextCard = dueCards[0];
        dispatch({ type: 'SET_CURRENT_CARD', payload: nextCard });
        
        // Set display mode and direction for the card
        const displayMode = SpacedRepetitionService.getDisplayMode(nextCard);
        const direction = SpacedRepetitionService.getReviewDirection(nextCard);
        
        setCurrentDisplayMode(displayMode);
        setCurrentDirection(direction);
      } else {
        // No more cards to review
        handleEndSession();
      }
    }
  }, [state.currentCard, state.cards]);

  const handleCardReview = (result: ReviewResult) => {
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
    const updatedCard = SpacedRepetitionService.processReview(state.currentCard, result);
    
    // Save updated card to database
    CardService.updateCard(updatedCard)
      .then(savedCard => {
        dispatch({ type: 'UPDATE_CARD', payload: savedCard });
      })
      .catch(error => {
        console.error('Error updating card after review:', error);
        // Still update in memory even if database save fails
        dispatch({ type: 'UPDATE_CARD', payload: updatedCard });
      });

    // Update session stats
    dispatch({
      type: 'UPDATE_SESSION_STATS',
      payload: {
        cardsReviewed: state.sessionStats.cardsReviewed + 1,
        correctAnswers: state.sessionStats.correctAnswers + (result.correct ? 1 : 0),
        timeSpent: state.sessionStats.timeSpent + result.timeSpent
      }
    });

    // Clear current card to trigger loading of next card
    dispatch({ type: 'SET_CURRENT_CARD', payload: null });
  };

  const handleEndSession = () => {
    const sessionTime = new Date().getTime() - sessionStartTime.getTime();
    const sessionTimeMinutes = Math.floor(sessionTime / 60000);

    // Update user stats
    const masteredCards = state.cards.filter(card => card.progress >= 90).length;
    const learnedCards = state.cards.filter(card => card.progress >= 60).length;
    const dueCards = SpacedRepetitionService.getDueCards(state.cards);

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

  const handleEditCard = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.currentCard) return;
    
    const updatedCard: Card = {
      ...cardData,
      id: state.currentCard.id,
      createdAt: state.currentCard.createdAt,
      updatedAt: new Date()
    };
    
    CardService.updateCard(updatedCard)
      .then(savedCard => {
        dispatch({ type: 'UPDATE_CARD', payload: savedCard });
        dispatch({ type: 'SET_CURRENT_CARD', payload: savedCard });
        setIsEditModalOpen(false);
      })
      .catch(error => {
        console.error('Error updating card:', error);
        alert('Ошибка при обновлении карточки');
      });
  };

  const handleAddCard = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    CardService.createCard(cardData)
      .then(newCard => {
        dispatch({ type: 'ADD_CARD', payload: newCard });
        setIsAddModalOpen(false);
      })
      .catch(error => {
        console.error('Error adding card:', error);
        alert('Ошибка при добавлении карточки');
      });
  };

  const handleDeleteCard = () => {
    if (!state.currentCard) return;
    
    if (showDeleteConfirm) {
      CardService.deleteCard(state.currentCard.id)
        .then(() => {
          // Remove the card from the cards array
          const updatedCards = state.cards.filter(card => card.id !== state.currentCard!.id);
          
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
  const totalDueCards = SpacedRepetitionService.getDueCards(state.cards).length;
  const remainingCards = totalDueCards - state.sessionStats.cardsReviewed;

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="max-w-md mx-auto bg-gray-200 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleEndSession}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Home className="w-6 h-6" />
          </button>
          
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

        <div className="flex-1 flex items-center justify-center px-4 pt-1 pb-4 relative">
          {state.currentCard ? (
            <CardDisplay
              card={state.currentCard}
              displayMode={currentDisplayMode}
              direction={currentDirection}
              onReview={handleCardReview}
            />
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

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-transparent px-6 py-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
            disabled={!state.currentCard}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">✏️</span>
            </div>
            <span className="text-xs font-medium">Редактировать</span>
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">➕</span>
            </div>
            <span className="text-xs font-medium">Добавить</span>
          </button>
          
          <button
            onClick={handleDeleteCard}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              showDeleteConfirm 
                ? 'text-red-600' 
                : 'text-gray-600 hover:text-red-600'
            }`}
            disabled={!state.currentCard}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              showDeleteConfirm 
                ? 'bg-red-200 animate-pulse' 
                : 'bg-red-100'
            }`}>
              <span className="text-red-600 text-lg">🗑️</span>
            </div>
            <span className="text-xs font-medium">
              {showDeleteConfirm ? 'Подтвердить' : 'Удалить'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};