import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (knownLanguage: Language, learningLanguage: Language, level: string) => void;
  currentKnownLanguage?: Language;
  currentLearningLanguage?: Language;
  currentLevel?: string;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

const DIFFICULTY_LEVELS = [
  { value: 'Beginner', label: 'Начинающий' },
  { value: 'Elementary', label: 'Элементарный' },
  { value: 'Intermediate', label: 'Средний' },
  { value: 'Upper-Intermediate', label: 'Выше среднего' },
  { value: 'Advanced', label: 'Продвинутый' },
  { value: 'Proficient', label: 'Профессиональный' }
];

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentKnownLanguage,
  currentLearningLanguage,
  currentLevel
}) => {
  const [knownLanguage, setKnownLanguage] = useState<Language | null>(currentKnownLanguage || null);
  const [learningLanguage, setLearningLanguage] = useState<Language | null>(currentLearningLanguage || null);
  const [level, setLevel] = useState<string>(currentLevel || 'Beginner');
  const [knownDropdownOpen, setKnownDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKnownLanguage(currentKnownLanguage || AVAILABLE_LANGUAGES[0]);
      setLearningLanguage(currentLearningLanguage || AVAILABLE_LANGUAGES[2]);
      setLevel(currentLevel || 'Beginner');
    }
  }, [isOpen, currentKnownLanguage, currentLearningLanguage, currentLevel]);

  const handleSave = () => {
    if (knownLanguage && learningLanguage && knownLanguage.code !== learningLanguage.code) {
      onSave(knownLanguage, learningLanguage, level);
      onClose();
    }
  };

  const CustomDropdown: React.FC<{
    label: string;
    value: string;
    options: Array<{ code?: string; name?: string; value?: string; label: string; flag?: string }>;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (option: any) => void;
  }> = ({ label, value, options, isOpen, onToggle, onSelect }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-4 bg-white border border-gray-300 rounded-xl text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <span className="text-gray-900 font-medium">{value}</span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.code || option.value}
                onClick={() => {
                  onSelect(option);
                  onToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {option.flag && <span className="text-xl">{option.flag}</span>}
                <span className="font-medium text-gray-900">
                  {option.name || option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Выбор языков
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Learning Language Dropdown */}
          <CustomDropdown
            label="Учу язык"
            value={learningLanguage?.name || 'Выберите язык'}
            options={AVAILABLE_LANGUAGES}
            isOpen={learningDropdownOpen}
            onToggle={() => setLearningDropdownOpen(!learningDropdownOpen)}
            onSelect={(language) => setLearningLanguage(language)}
          />

          {/* Known Language Dropdown */}
          <CustomDropdown
            label="Знаю язык"
            value={knownLanguage?.name || 'Выберите язык'}
            options={AVAILABLE_LANGUAGES.filter(lang => lang.code !== learningLanguage?.code)}
            isOpen={knownDropdownOpen}
            onToggle={() => setKnownDropdownOpen(!knownDropdownOpen)}
            onSelect={(language) => setKnownLanguage(language)}
          />

          {/* Difficulty Level Dropdown */}
          <CustomDropdown
            label="Уровень сложности"
            value={DIFFICULTY_LEVELS.find(l => l.value === level)?.label || 'Начинающий'}
            options={DIFFICULTY_LEVELS}
            isOpen={levelDropdownOpen}
            onToggle={() => setLevelDropdownOpen(!levelDropdownOpen)}
            onSelect={(levelOption) => setLevel(levelOption.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!knownLanguage || !learningLanguage || knownLanguage.code === learningLanguage.code}
            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};