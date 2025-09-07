import React from 'react';
import { TrendingUp, Calendar, Target, Award, Clock, Flame } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CardState } from '../../types';

interface StatsScreenProps {
  onBack: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onBack }) => {
  const { state } = useAppContext();
  
  const totalCards = state.cards.length;
  const learnCards = state.cards.filter(card => card.state === CardState.LEARN).length;
  const knownCards = state.cards.filter(card => card.state === CardState.KNOW).length;
  const masteredCards = state.cards.filter(card => card.state === CardState.MASTERED).length;
  
  const averageProgress = totalCards > 0 
    ? Math.round(state.cards.reduce((sum, card) => sum + card.progress, 0) / totalCards)
    : 0;

  const totalReviews = state.cards.reduce((sum, card) => sum + card.reviewCount, 0);
  
  const accuracyRate = totalReviews > 0
    ? Math.round((state.cards.reduce((sum, card) => sum + card.successfulReviews, 0) / totalReviews) * 100)
    : 0;

  const difficultyAnalysis = state.cards
    .filter(card => card.reviewCount > 2)
    .sort((a, b) => (a.successfulReviews / a.reviewCount) - (b.successfulReviews / b.reviewCount))
    .slice(0, 5);

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
            <h1 className="font-semibold text-gray-900">Статистика</h1>
            <div className="w-12" /> {/* Spacer */}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
              <Flame className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{state.userStats.streak}</div>
              <div className="text-sm opacity-90">Дней подряд</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
              <Award className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{masteredCards}</div>
              <div className="text-sm opacity-90">Выучено</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
              <Target className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{averageProgress}%</div>
              <div className="text-sm opacity-90">Средний прогресс</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white">
              <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-2xl font-bold">{accuracyRate}%</div>
              <div className="text-sm opacity-90">Точность</div>
            </div>
          </div>

          {/* Progress Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Распределение карточек</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Учу</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{learnCards}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${totalCards > 0 ? (learnCards / totalCards) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Знаю</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{knownCards}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${totalCards > 0 ? (knownCards / totalCards) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Выучено</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{masteredCards}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${totalCards > 0 ? (masteredCards / totalCards) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Активность</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
                <div className="text-sm text-gray-600">Всего повторений</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalCards}</div>
                <div className="text-sm text-gray-600">Карточек добавлено</div>
              </div>
            </div>
          </div>

          {/* Difficult Words */}
          {difficultyAnalysis.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Сложные слова</h3>
              <div className="space-y-3">
                {difficultyAnalysis.map(card => {
                  const successRate = card.reviewCount > 0 
                    ? Math.round((card.successfulReviews / card.reviewCount) * 100)
                    : 0;
                  
                  return (
                    <div key={card.id} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{card.term}</div>
                        <div className="text-sm text-gray-600">{card.translation}</div>
                      </div>
                      <div className="text-sm text-red-600 font-medium">
                        {successRate}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};