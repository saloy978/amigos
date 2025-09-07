import React, { useState } from 'react';
import { X, Sparkles, Brain, Check, Plus, Loader2 } from 'lucide-react';
import { Card, CardState, ReviewDirection } from '../../types';
import { AIWordGeneratorService } from '../../services/aiWordGenerator';
import { UserService } from '../../services/userService';
import { DatabaseService } from '../../services/database';

interface AIWordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  existingCards: Card[];
}

interface WordSuggestion {
  term: string;
  translation: string;
  imageUrl?: string;
  example?: string;
  difficulty: string;
  selected: boolean;
}

export const AIWordGeneratorModal: React.FC<AIWordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCards
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [currentUser] = useState(() => UserService.getCurrentUser());
  const [currentSettings] = useState(() => {
    const settings = UserService.getUserSettings();
    const dbSettings = DatabaseService.getLanguagePair();
    return settings || dbSettings;
  });

  const handleGenerate = async () => {
    console.log('🚀 Starting AI word generation...');
    console.log('Current user:', currentUser);
    console.log('Current settings:', currentSettings);
    console.log('Existing cards count:', existingCards.length);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      alert('Ошибка: не удалось получить данные пользователя');
      return;
    }

    // Get current language settings
    const languageSettings = UserService.getUserSettings() || DatabaseService.getLanguagePair();
    console.log('Language settings:', languageSettings);
    
    if (!languageSettings) {
      console.error('❌ No language settings found');
      alert('Ошибка: не удалось получить настройки языков');
      return;
    }
    
    setIsGenerating(true);
    setSuggestions([]);

    try {
      const existingWords = existingCards.map(card => card.term);
      console.log('Existing words:', existingWords);
      
      // Добавляем небольшую задержку для лучшего UX
      console.log('⏳ Generating words...');
      
      const generatedWords = await AIWordGeneratorService.generateWords({
        knownLanguage: languageSettings.known_language,
        learningLanguage: languageSettings.learning_language,
        knownLanguageCode: languageSettings.known_language_code,
        learningLanguageCode: languageSettings.learning_language_code,
        userLevel: currentUser.level,
        existingWords
      });

      console.log('✅ Generated words:', generatedWords);
      
      if (generatedWords.length === 0) {
        console.warn('⚠️ No words generated');
        alert('Не удалось сгенерировать новые слова. Попробуйте изменить уровень или языковую пару.');
        return;
      }
      
      const wordsWithSelection = generatedWords.map(word => ({
        ...word,
        selected: true
      }));

      setSuggestions(wordsWithSelection);
      setSelectedCount(wordsWithSelection.length);
      console.log('✅ Words set in state:', wordsWithSelection.length);
      console.log('📊 Words by theme:', wordsWithSelection.map(w => `${w.term} -> ${w.translation}`));
    } catch (error) {
      console.error('Error generating words:', error);
      alert(`Ошибка генерации слов: ${error.message || 'Попробуйте позже.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleWordSelection = (index: number) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index].selected = !newSuggestions[index].selected;
    setSuggestions(newSuggestions);
    setSelectedCount(newSuggestions.filter(s => s.selected).length);
  };

  const handleSave = () => {
    console.log('💾 Starting to save words...');
    const selectedWords = suggestions.filter(s => s.selected);
    console.log('Selected words for saving:', selectedWords);
    
    if (selectedWords.length === 0) {
      console.warn('⚠️ No words selected');
      alert('Выберите хотя бы одно слово для добавления');
      return;
    }

    // Get current language pair settings
    const settings = UserService.getUserSettings() || DatabaseService.getLanguagePair();
    console.log('Settings for language pair:', settings);
    const languagePairId = settings ? DatabaseService.generateLanguagePairId(
      settings.known_language_code,
      settings.learning_language_code
    ) : 'ru-es';
    console.log('Generated language pair ID:', languagePairId);

    const cards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[] = selectedWords.map(word => ({
      term: word.term,
      translation: word.translation,
      imageUrl: word.imageUrl,
      progress: 0,
      state: CardState.LEARN,
      dueAt: new Date(),
      reviewCount: 0,
      successfulReviews: 0,
      direction: ReviewDirection.KNOWN_TO_LEARNING,
      languagePairId,
      easeFactor: 2.5,
      intervalDays: 0
    }));

    console.log('Cards to save:', cards);
    
    try {
      onSave(cards);
      console.log('✅ Cards sent to onSave callback successfully');
      
      // Показываем успешное сообщение с деталями
      const message = `🎉 Успешно добавлено ${selectedWords.length} новых слов!\n\n` +
        `Тема: ${AIWordGeneratorService.getThemeForLevel(currentUser?.level || 'A1')}\n` +
        `Уровень: ${currentUser?.level || 'A1'}`;
      alert(message);
    } catch (error) {
      console.error('❌ Error saving cards:', error);
      alert('Ошибка при сохранении слов. Попробуйте еще раз.');
      return;
    }
    
    console.log('✅ Cards sent to onSave callback');
    onClose();
    setSuggestions([]);
    setSelectedCount(0);
  };

  const selectAll = () => {
    const newSuggestions = suggestions.map(s => ({ ...s, selected: true }));
    setSuggestions(newSuggestions);
    setSelectedCount(newSuggestions.length);
  };

  const deselectAll = () => {
    const newSuggestions = suggestions.map(s => ({ ...s, selected: false }));
    setSuggestions(newSuggestions);
    setSelectedCount(0);
  };

  const handleRegenerate = () => {
    console.log('🔄 Regenerating words...');
    setSuggestions([]);
    setSelectedCount(0);
    handleGenerate();
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              ИИ помощник
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* User Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">
                Ваш профиль обучения
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Уровень: <span className="font-medium text-blue-600">{currentUser?.level || 'A1'}</span></div>
              <div>Языковая пара: <span className="font-medium">
                {currentSettings?.learning_language || 'Español'} → {currentSettings?.known_language || 'Русский'}
              </span></div>
              <div className="text-xs text-gray-500 mt-2">
                {AIWordGeneratorService.getLevelDescription(currentUser?.level || 'A1')}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          {suggestions.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Генерируем слова...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Добавить 10 слов с помощью ИИ
                </>
              )}
            </button>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Подбираем слова для уровня {currentUser?.level}...</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {AIWordGeneratorService.getThemeForLevel(currentUser?.level || 'A1')}
              </div>
            </div>
          )}

          {/* Generated Words */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Выбрано: <span className="font-medium text-blue-600">{selectedCount}</span> из {suggestions.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Все
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Ничего
                  </button>
                </div>
              </div>

              {/* Words List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {suggestions.map((word, index) => (
                  <div
                    key={index}
                    onClick={() => toggleWordSelection(index)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      word.selected
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{word.term}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-blue-600">{word.translation}</span>
                        </div>
                        {word.example && (
                          <div className="text-xs text-gray-500 italic">
                            {word.example}
                          </div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        word.selected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {word.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  {isGenerating ? 'Генерируем...' : 'Сгенерировать заново'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedCount === 0 || isGenerating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить ({selectedCount})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};