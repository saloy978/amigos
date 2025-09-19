import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Search, X } from 'lucide-react';

interface DictionaryScreenProps {
  wrongWords: string[];
  onBackToMenu: () => void;
  playButtonClick: () => void;
}

export const DictionaryScreen: React.FC<DictionaryScreenProps> = ({
  wrongWords,
  onBackToMenu,
  playButtonClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация слов по поисковому запросу
  const filteredWords = wrongWords.filter(word =>
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-green-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg border-4 border-yellow-400">
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
            <BookOpen className="w-6 h-6" />
            <span>DICCIONARIO</span>
          </h1>
          
          <div className="w-9"></div> {/* Spacer */}
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar palabras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-green-700 text-white placeholder-gray-400 py-3 pl-10 pr-10 rounded-xl border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-green-700 rounded-xl p-4 mb-6 border-2 border-yellow-400">
          <div className="text-center">
            <div className="text-yellow-400 font-bold text-lg">
              {wrongWords.length} palabras estudiadas
            </div>
            <div className="text-gray-300 text-sm">
              {filteredWords.length} {searchTerm ? 'encontradas' : 'en total'}
            </div>
          </div>
        </div>

        {/* Список слов */}
        <div className="bg-green-700 rounded-xl p-4 border-2 border-yellow-400 max-h-96 overflow-y-auto">
          {filteredWords.length > 0 ? (
            <div className="space-y-2">
              {filteredWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-green-600 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {word}
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    Palabra difícil
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-8">
              {searchTerm ? (
                <>
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron palabras</p>
                  <p className="text-sm">Intenta con otro término de búsqueda</p>
                </>
              ) : (
                <>
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay palabras en el diccionario</p>
                  <p className="text-sm">Las palabras que falles aparecerán aquí</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="mt-4 text-center">
          <p className="text-gray-300 text-sm">
            Las palabras que falles se guardan aquí para que puedas repasarlas
          </p>
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
