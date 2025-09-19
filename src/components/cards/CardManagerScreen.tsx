import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { UserCardWithContent, CardState } from '../../types';
import { AddWordModal } from '../modals/AddWordModal';
import { AIWordGeneratorModal } from '../modals/AIWordGeneratorModal';
import { SpacedRepetitionAdapter } from '../../services/spacedRepetitionAdapter';
import { CardService } from '../../services/cardService';

interface CardManagerScreenProps {
  onBack: () => void;
  initialFilter?: FilterType;
}

type FilterType = 'all' | 'learn' | 'review' | 'suspended';

export const CardManagerScreen: React.FC<CardManagerScreenProps> = ({ onBack, initialFilter = 'all' }) => {
  const { state, dispatch } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<UserCardWithContent | null>(null);

  // Обновляем активный фильтр при изменении initialFilter
  React.useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const filters = [
    { key: 'all' as FilterType, label: 'Все', color: 'bg-gray-500' },
    { key: 'learn' as FilterType, label: 'Учить', color: 'bg-orange-500' },
    { key: 'review' as FilterType, label: 'Знаю', color: 'bg-blue-500' },
    { key: 'suspended' as FilterType, label: 'Выучено', color: 'bg-green-500' }
  ];

  const filteredCards = useMemo(() => {
    // Сначала обновляем статусы карточек на основе прогресса и времени до повторения
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
    
    let cards = cardsWithUpdatedStates;

    // Apply filter
    if (activeFilter !== 'all') {
      const stateMap: Record<FilterType, CardState> = {
        'all': CardState.LEARN, // не используется
        'learn': CardState.LEARN,
        'review': CardState.REVIEW,
        'suspended': CardState.SUSPENDED
      };
      cards = cards.filter(card => card.state === stateMap[activeFilter]);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cards = cards.filter(card => 
        card.term.toLowerCase().includes(query) || 
        card.translation.toLowerCase().includes(query)
      );
    }

    // Sort by time until next review (closest to due date first)
    return cards.sort((a, b) => {
      const now = new Date();
      const aTimeUntil = a.dueAt.getTime() - now.getTime();
      const bTimeUntil = b.dueAt.getTime() - now.getTime();
      
      // Сначала просроченные карточки (отрицательное время)
      if (aTimeUntil < 0 && bTimeUntil >= 0) return -1;
      if (aTimeUntil >= 0 && bTimeUntil < 0) return 1;
      
      // Затем по времени до повторения (меньшее время первым)
      return aTimeUntil - bTimeUntil;
    });
  }, [state.cards, activeFilter, searchQuery]);

  const getCardCounts = (): Record<FilterType, number> => {
    // Используем ту же логику обновления состояний, что и в filteredCards
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

    return {
      all: cardsWithUpdatedStates.length,
      learn: cardsWithUpdatedStates.filter(card => card.state === CardState.LEARN).length,
      review: cardsWithUpdatedStates.filter(card => card.state === CardState.REVIEW).length,
      suspended: cardsWithUpdatedStates.filter(card => card.state === CardState.SUSPENDED).length
    };
  };

  const cardCounts = getCardCounts();

  const handleAddCard = async (cardData: any) => {
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

  const handleAddAICards = async (cardsData: any[]) => {
    try {
      // Добавляем все карточки через CardService
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
      
      // Добавляем все карточки в состояние
      newCards.forEach(newCard => {
        if (newCard) {
          dispatch({ type: 'ADD_CARD', payload: newCard });
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
    } catch (error) {
      console.error('Error adding AI cards:', error);
      alert('Ошибка при добавлении карточек');
    }
  };

  const handleEditCard = async (cardData: any) => {
    console.log('🔄 CardManager: handleEditCard called');
    console.log('🔄 CardManager: editingCard:', editingCard);
    console.log('🔄 CardManager: cardData:', cardData);
    
    if (!editingCard) {
      console.log('❌ CardManager: No editing card found');
      return;
    }
    
    try {
      console.log('🔄 CardManager: Starting card update process');
      console.log('🔄 CardManager: Card ID:', editingCard.cardId);
      console.log('🔄 CardManager: New data:', {
        term: cardData.term,
        translation: cardData.translation,
        imageUrl: cardData.imageUrl,
        english: cardData.english
      });
      
      // Update card content in the database
      console.log('🔄 CardManager: Calling CardService.updateCardContent...');
      await CardService.updateCardContent(
        editingCard.cardId,
        cardData.term,
        cardData.translation,
        cardData.imageUrl,
        cardData.english
      );
      console.log('✅ CardManager: CardService.updateCardContent completed');
      
      // Update the card in the local state
      const updatedCard = {
        ...editingCard,
        term: cardData.term.trim(),
        translation: cardData.translation.trim(),
        imageUrl: cardData.imageUrl?.trim() || undefined,
        english: cardData.english?.trim() || undefined
      };
      console.log('🔄 CardManager: Updated card object:', updatedCard);
      
      // Update the card in the context
      console.log('🔄 CardManager: Dispatching UPDATE_CARD action...');
      dispatch({ type: 'UPDATE_CARD', payload: updatedCard });
      console.log('✅ CardManager: UPDATE_CARD action dispatched');
      
      console.log('✅ CardManager: Card updated successfully');
      
      // Reload cards to get updated data (in case of merge)
      console.log('🔄 CardManager: Reloading cards to get updated data...');
      const updatedCards = await CardService.getUserCards();
      dispatch({ type: 'SET_CARDS', payload: updatedCards });
      console.log('✅ CardManager: Cards reloaded:', updatedCards.length);
      
      setEditingCard(null);
      console.log('✅ CardManager: Modal closed');
    } catch (error) {
      console.error('❌ CardManager: Error updating card:', error);
      console.error('❌ CardManager: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ CardManager: Alert error message:', errorMessage);
      
      alert('Ошибка при сохранении изменений карточки: ' + errorMessage);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
      CardService.removeCardFromUser(parseInt(cardId))
        .then(() => {
          const updatedCards = state.cards.filter(card => card.cardId.toString() !== cardId);
          dispatch({ type: 'SET_CARDS', payload: updatedCards });
        })
        .catch(error => {
          console.error('Error deleting card:', error);
          alert('Ошибка при удалении карточки');
        });
    }
  };

  const formatTimeUntil = (userCard: UserCardWithContent): string => {
    return SpacedRepetitionAdapter.getTimeUntilNext(userCard);
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 60) return 'text-orange-500';
    if (progress < 90) return 'text-blue-500';
    return 'text-green-500';
  };

  const getProgressBgColor = (progress: number): string => {
    if (progress < 60) return 'bg-orange-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-blue-600 font-medium"
            >
              ← Назад
            </button>
            <h1 className="font-semibold text-gray-900">Карточки</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск карточек..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeFilter === filter.key
                    ? `${filter.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="font-medium">{filter.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activeFilter === filter.key
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {cardCounts[filter.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {searchQuery ? 'Карточки не найдены' : 'Нет карточек'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? 'Попробуйте изменить поисковый запрос'
                  : state.cards.length === 0 
                    ? 'Добавьте первую карточку для изучения'
                    : `Нет карточек в категории "${filters.find(f => f.key === activeFilter)?.label}"`
                }
              </p>
              {!searchQuery && (state.cards.length === 0 || (activeFilter === 'learn' && cardCounts.learn === 0)) && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Добавить 10 карточек с помощью ИИ
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Добавить карточку вручную
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredCards.map((card) => {
                const isOverdue = card.dueAt <= new Date();
                
                return (
                  <div
                    key={card.cardId}
                    className={`bg-white border-2 rounded-xl p-4 transition-all ${
                      isOverdue ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{card.term}</h3>
                          <div className={`w-2 h-2 rounded-full ${getProgressBgColor(card.progress)}`} />
                        </div>
                        <p className="text-gray-600">{card.translation}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCard(card)}
                          className="p-2 bg-transparent hover:bg-blue-50 rounded-lg transition-all transform hover:scale-105"
                        >
                          <img 
                            src="/assets/Edit.png" 
                            alt="Редактировать" 
                            className="w-5 h-5 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
                            }}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.cardId.toString())}
                          className="p-2 bg-transparent hover:bg-red-50 rounded-lg transition-all transform hover:scale-105"
                        >
                          <img 
                            src="/assets/Delete.png" 
                            alt="Удалить" 
                            className="w-5 h-5 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
                            }}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium ${getProgressColor(card.progress)}`}>
                            {card.progress}%
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {isOverdue ? 'Просрочено' : formatTimeUntil(card)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {card.reviewCount} повторений
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBgColor(card.progress)}`}
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Word Modal */}
        <AddWordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddCard}
          existingCards={[]}
        />

        {/* Edit Word Modal */}
        <AddWordModal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleEditCard}
          editCard={editingCard}
          existingCards={[]}
        />

        {/* AI Word Generator Modal */}
        <AIWordGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSave={handleAddAICards}
          existingCards={state.cards}
        />
      </div>
    </div>
  );
};