import React from 'react';
import { Trophy, ArrowLeft, Medal } from 'lucide-react';

interface RecordsScreenProps {
  records: number[];
  totalGames: number;
  wins: number;
  losses: number;
  accuracy: number;
  onBackToMenu: () => void;
  playButtonClick: () => void;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  records,
  totalGames,
  wins,
  losses,
  accuracy,
  onBackToMenu,
  playButtonClick
}) => {
  const topRecords = records.slice(-5).reverse(); // Последние 5 рекордов

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-green-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border-4 border-yellow-400">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              playButtonClick();
              onBackToMenu();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-2xl font-bold text-yellow-400 flex items-center space-x-2">
            <Trophy className="w-6 h-6" />
            <span>RÉCORDS</span>
          </h1>
          
          <div className="w-9"></div> {/* Spacer */}
        </div>

        {/* Общая статистика */}
        <div className="bg-green-700 rounded-xl p-6 mb-6 border-2 border-yellow-400">
          <h2 className="text-yellow-400 font-bold text-lg mb-4 text-center">
            ESTADÍSTICAS GENERALES
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-white font-bold text-2xl">{totalGames}</div>
              <div className="text-gray-300 text-sm">Partidas</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold text-2xl">{wins}</div>
              <div className="text-gray-300 text-sm">Victorias</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-2xl">{losses}</div>
              <div className="text-gray-300 text-sm">Derrotas</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-2xl">{accuracy}%</div>
              <div className="text-gray-300 text-sm">Precisión</div>
            </div>
          </div>
        </div>

        {/* Топ рекорды */}
        <div className="bg-green-700 rounded-xl p-6 border-2 border-yellow-400">
          <h2 className="text-yellow-400 font-bold text-lg mb-4 text-center">
            TOP 5 RÉCORDS
          </h2>
          
          {topRecords.length > 0 ? (
            <div className="space-y-3">
              {topRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-green-600 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    {index === 0 && <Medal className="w-5 h-5 text-yellow-400" />}
                    {index === 1 && <Medal className="w-5 h-5 text-gray-300" />}
                    {index === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                    {index > 2 && <div className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold text-sm">#{index + 1}</div>}
                    <span className="text-white font-semibold">
                      {index === 0 ? 'Mejor récord' : `Récord #${index + 1}`}
                    </span>
                  </div>
                  <span className="text-yellow-400 font-bold text-lg">
                    {record} créditos
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-4">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aún no tienes récords</p>
              <p className="text-sm">¡Juega para establecer tu primer récord!</p>
            </div>
          )}
        </div>

        {/* Декоративные элементы */}
        <div className="mt-6 flex justify-center space-x-2">
          {[...Array(5)].map((_, i) => (
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
