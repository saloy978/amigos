import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LessonAlphabetScreenProps {
  lessonId: string;
  onBack: () => void;
  onUpdateProgress: (progress: number) => void;
}

export const LessonAlphabetScreen: React.FC<LessonAlphabetScreenProps> = ({ lessonId, onBack, onUpdateProgress }) => {
  const spanishAlphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  const letterSounds: { [key: string]: string } = {
    'A': 'A', 'B': 'Be', 'C': 'Ce', 'D': 'De', 'E': 'E', 'F': 'Efe', 'G': 'Ge',
    'H': 'Hache', 'I': 'I', 'J': 'Jota', 'K': 'Ka', 'L': 'Ele', 'M': 'Eme',
    'N': 'Ene', 'Ñ': 'Eñe', 'O': 'O', 'P': 'Pe', 'Q': 'Cu', 'R': 'Erre',
    'S': 'Ese', 'T': 'Te', 'U': 'U', 'V': 'Uve', 'W': 'Doble uve', 'X': 'Equis',
    'Y': 'I griega', 'Z': 'Zeta'
  };

  const handleLetterClick = (letter: string) => {
    const soundText = letterSounds[letter];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(soundText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  React.useEffect(() => {
    // Урок считается пройденным при заходе
    onUpdateProgress(100);
  }, [onUpdateProgress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-colors mb-4 inline-flex items-center gap-2"
          title="Назад к урокам"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Испанский алфавит</h1>
          
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">📋 27 букв</h2>
            <p className="text-gray-600">Испанский алфавит содержит 27 букв, включая уникальную букву Ñ (eñe).</p>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3 mt-4">
              {spanishAlphabet.map(letter => (
                <div
                  key={letter}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-xl text-center font-bold text-lg cursor-pointer transition-transform transform hover:scale-110"
                  title={`${letter} - ${letterSounds[letter]}`}
                  onClick={() => handleLetterClick(letter)}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">🔊 Произношение</h2>
            <p className="text-gray-600 mb-4">Нажмите на букву, чтобы услышать её произношение.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <strong className="text-blue-800">Особенности испанского алфавита:</strong>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                <li><strong>Ñ (eñe)</strong> - уникальная буква испанского алфавита</li>
                <li><strong>H (hache)</strong> - не произносится в большинстве случаев</li>
                <li><strong>LL (elle)</strong> - раньше считалась отдельной буквой, сейчас произносится как 'й'</li>
                <li><strong>CH (che)</strong> - раньше считалась отдельной буквой, произносится как 'ч'</li>
                <li><strong>RR (erre doble)</strong> - двойная R для сильного раскатистого звука 'р'</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

