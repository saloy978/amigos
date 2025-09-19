import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface GameOverScreenProps {
  finalBalance: number;
  totalGames: number;
  wins: number;
  losses: number;
  accuracy: number;
  maxBalance: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  playButtonClick: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  finalBalance,
  totalGames,
  wins,
  losses,
  accuracy,
  maxBalance,
  onPlayAgain,
  onBackToMenu,
  playButtonClick
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-green-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border-4 border-yellow-400">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-400">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            ¡JUEGO TERMINADO!
          </h1>
          <p className="text-yellow-400 text-lg">
            Se acabaron los créditos
          </p>
        </div>

        {/* Статистика */}
        <div className="bg-green-700 rounded-xl p-6 mb-8 border-2 border-yellow-400">
          <h2 className="text-yellow-400 font-bold text-xl mb-4 text-center">
            ESTADÍSTICAS FINALES
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Partidas jugadas:</span>
              <span className="text-white font-bold">{totalGames}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Victorias:</span>
              <span className="text-green-400 font-bold">{wins}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Derrotas:</span>
              <span className="text-red-400 font-bold">{losses}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Precisión:</span>
              <span className="text-yellow-400 font-bold">{accuracy}%</span>
            </div>
            
            <div className="border-t border-yellow-400 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Máximo balance:</span>
                <span className="text-yellow-400 font-bold text-lg">{maxBalance} créditos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="space-y-3">
          <button
            onClick={() => {
              playButtonClick();
              onPlayAgain();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-yellow-400 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-2">
              <RotateCcw className="w-5 h-5" />
              <span>JUGAR DE NUEVO</span>
            </div>
          </button>

          <button
            onClick={() => {
              playButtonClick();
              onBackToMenu();
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl border-2 border-yellow-400 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-2">
              <Home className="w-5 h-5" />
              <span>MENÚ PRINCIPAL</span>
            </div>
          </button>
        </div>

        {/* Мотивационное сообщение */}
        <div className="mt-6 text-center">
          <p className="text-gray-300 text-sm">
            ¡No te rindas! Cada partida te hace mejor.
          </p>
        </div>

        {/* Декоративные элементы */}
        <div className="mt-6 flex justify-center space-x-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-black'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
