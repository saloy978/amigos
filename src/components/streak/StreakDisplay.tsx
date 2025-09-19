import React from 'react';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  totalDaysActive,
  isLoading = false,
  error = null,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4 text-white ${className}`}>
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-gray-600 ${className}`}>
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5" />
          <span className="text-sm">Ошибка загрузки streak</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6" />
            <div>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-xs opacity-90">дней подряд</div>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white opacity-30"></div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <div>
              <div className="text-lg font-semibold">{longestStreak}</div>
              <div className="text-xs opacity-90">рекорд</div>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white opacity-30"></div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <div>
              <div className="text-lg font-semibold">{totalDaysActive}</div>
              <div className="text-xs opacity-90">всего дней</div>
            </div>
          </div>
        </div>
        
        {currentStreak > 0 && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : '✨'}
            </span>
          </div>
        )}
      </div>
      
      {currentStreak > 0 && (
        <div className="mt-3 text-xs opacity-90">
          {currentStreak === 1 && "Отличное начало! Продолжайте в том же духе! 🎉"}
          {currentStreak === 2 && "Два дня подряд! Вы на правильном пути! 💪"}
          {currentStreak === 3 && "Три дня подряд! Отличная мотивация! ⚡"}
          {currentStreak >= 4 && currentStreak < 7 && "Отличная последовательность! Продолжайте! 🚀"}
          {currentStreak >= 7 && currentStreak < 14 && "Неделя подряд! Вы невероятны! 🔥"}
          {currentStreak >= 14 && currentStreak < 30 && "Две недели подряд! Вы мастер! 🏆"}
          {currentStreak >= 30 && "Месяц подряд! Вы легенда! 👑"}
        </div>
      )}
    </div>
  );
};


















