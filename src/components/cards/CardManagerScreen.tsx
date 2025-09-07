import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardState } from '../../types';
import { AddWordModal } from '../modals/AddWordModal';
import { SpacedRepetitionService } from '../../services/spacedRepetition';
import { CardService } from '../../services/cardService';

interface CardManagerScreenProps {
  onBack: () => void;
}

type FilterType = 'all' | 'learn' | 'know' | 'mastered';

export const CardManagerScreen: React.FC<CardManagerScreenProps> = ({ onBack }) => {
  const { state, dispatch } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const filters = [
    { key: 'all' as FilterType, label: 'Все', color: 'bg-gray-500' },
    { key: 'learn' as FilterType, label: 'Учить', color: 'bg-orange-500' },
    { key: 'know' as FilterType, label: 'Знаю', color: 'bg-blue-500' },
    { key: 'mastered' as FilterType, label: 'Выучено', color: 'bg-green-500' }
  ];

  const filteredCards = useMemo(() => {
    // Сначала обновляем статусы карточек на основе времени до показа
    const cardsWithUpdatedStates = state.cards.map(card => 
      SpacedRepetitionService.updateCardStateBasedOnDueTime(card)
    );
    
    let cards = cardsWithUpdatedStates;

    // Apply filter
    if (activeFilter !== 'all') {
      const stateMap: Record<FilterType, CardState> = {
        'all': CardState.LEARN, // не используется
        'learn': CardState.LEARN,
        'know': CardState.KNOW,
        'mastered': CardState.MASTERED
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

    // Sort by due date (overdue first, then by progress)
    return cards.sort((a, b) => {
      const now = new Date();
      const aOverdue = a.dueAt <= now;
      const bOverdue = b.dueAt <= now;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return b.progress - a.progress;
    });
  }, [state.cards, activeFilter, searchQuery]);

  const getCardCounts = () => {
    return {
      all: state.cards.length,
      learn: state.cards.filter(card => card.state === CardState.LEARN).length,
      know: state.cards.filter(card => card.state === CardState.KNOW).length,
      mastered: state.cards.filter(card => card.state === CardState.MASTERED).length
    };
  };

  const cardCounts = getCardCounts();

  const handleAddCard = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    CardService.createCard(cardData)
      .then(newCard => {
        dispatch({ type: 'ADD_CARD', payload: newCard });
      })
      .catch(error => {
        console.error('Error adding card:', error);
        alert('Ошибка при добавлении карточки');
      });
  };

  const handleEditCard = (cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCard) return;
    
    const updatedCard: Card = {
      ...cardData,
      id: editingCard.id,
      createdAt: editingCard.createdAt,
      updatedAt: new Date()
    };
    
    CardService.updateCard(updatedCard)
      .then(savedCard => {
        dispatch({ type: 'UPDATE_CARD', payload: savedCard });
        setEditingCard(null);
      })
      .catch(error => {
        console.error('Error updating card:', error);
        alert('Ошибка при обновлении карточки');
      });
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
      CardService.deleteCard(cardId)
        .then(() => {
          const updatedCards = state.cards.filter(card => card.id !== cardId);
          dispatch({ type: 'SET_CARDS', payload: updatedCards });
        })
        .catch(error => {
          console.error('Error deleting card:', error);
          alert('Ошибка при удалении карточки');
        });
    }
  };

  const formatTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Сейчас';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}д`;
    if (hours > 0) return `${hours}ч`;
    if (minutes > 0) return `${minutes}м`;
    return 'Сейчас';
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
                  : 'Добавьте первую карточку для изучения'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Добавить карточку
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredCards.map((card) => {
                const isOverdue = card.dueAt <= new Date();
                
                return (
                  <div
                    key={card.id}
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
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
                            {isOverdue ? 'Просрочено' : formatTimeUntil(card.dueAt)}
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
          existingCards={state.cards}
        />

        {/* Edit Word Modal */}
        <AddWordModal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleEditCard}
          editCard={editingCard}
          existingCards={state.cards}
        />
      </div>
    </div>
  );
};