import React, { useState, useEffect } from 'react';
import { X, Camera, Volume2 } from 'lucide-react';
import { Card, CardState, ReviewDirection } from '../../types';
import { DatabaseService } from '../../services/database';
import { SpacedRepetitionService } from '../../services/spacedRepetition';
import { UserService } from '../../services/userService';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editCard?: Card | null;
  existingCards?: Card[];
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editCard,
  existingCards = []
}) => {
  const [formData, setFormData] = useState({
    term: '',
    translation: '',
    imageUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [userSettings] = useState(() => UserService.getUserSettings());

  useEffect(() => {
    if (editCard) {
      setFormData({
        term: editCard.term,
        translation: editCard.translation,
        imageUrl: editCard.imageUrl || ''
      });
    } else {
      setFormData({
        term: '',
        translation: '',
        imageUrl: ''
      });
    }
    setErrors({});
    setDuplicateWarning('');
  }, [editCard, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.term.trim()) {
      newErrors.term = 'Слово обязательно';
    }

    if (!formData.translation.trim()) {
      newErrors.translation = 'Перевод обязателен';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Некорректный URL изображения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = () => {
    if (!formData.term.trim() || !formData.translation.trim()) return;
    
    const languagePairId = editCard?.languagePairId || (() => {
      const pair = DatabaseService.getLanguagePair();
      return pair ? DatabaseService.generateLanguagePairId(
        pair.known_language_code,
        pair.learning_language_code
      ) : 'ru-en';
    })();
    
    const duplicate = SpacedRepetitionService.checkForDuplicates(existingCards, formData.term.trim(), formData.translation.trim(), languagePairId);
    setDuplicateWarning(duplicate && duplicate.id !== editCard?.id ? `Похожая карточка уже существует: "${duplicate.term}" - "${duplicate.translation}"` : '');
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
      term: formData.term.trim(),
      translation: formData.translation.trim(),
      imageUrl: formData.imageUrl.trim() || undefined,
      progress: editCard?.progress || 0,
      state: editCard?.state || CardState.LEARN,
      dueAt: editCard?.dueAt || new Date(),
      reviewCount: editCard?.reviewCount || 0,
      successfulReviews: editCard?.successfulReviews || 0,
      direction: editCard?.direction || ReviewDirection.KNOWN_TO_LEARNING,
      languagePairId: editCard?.languagePairId || (() => {
        const pair = DatabaseService.getLanguagePair();
        return pair ? DatabaseService.generateLanguagePairId(
          pair.known_language_code,
          pair.learning_language_code
        ) : 'ru-en';
      })(),
      lastReviewedAt: editCard?.lastReviewedAt,
      easeFactor: editCard?.easeFactor || 2.5,
      intervalDays: editCard?.intervalDays || 0
    };

    onSave(cardData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setTimeout(checkForDuplicates, 300); // Проверяем дубликаты с задержкой
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editCard ? 'Редактировать слово' : 'Добавить слово'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Term Field */}
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
              Слово ({userSettings?.learning_language || 'English'})
            </label>
            <div className="relative">
              <input
                type="text"
                id="term"
                value={formData.term}
                onChange={(e) => handleInputChange('term', e.target.value)}
                placeholder={`Например: ${userSettings?.learning_language_code === 'en' ? 'apple' : userSettings?.learning_language_code === 'es' ? 'manzana' : userSettings?.learning_language_code === 'fr' ? 'pomme' : 'word'}`}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.term ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {errors.term && (
              <p className="mt-1 text-sm text-red-600">{errors.term}</p>
            )}
            {duplicateWarning && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">⚠️ {duplicateWarning}</p>
              </div>
            )}
          </div>

          {/* Translation Field */}
          <div>
            <label htmlFor="translation" className="block text-sm font-medium text-gray-700 mb-2">
              Перевод ({userSettings?.known_language || 'Русский'})
            </label>
            <div className="relative">
              <input
                type="text"
                id="translation"
                value={formData.translation}
                onChange={(e) => handleInputChange('translation', e.target.value)}
                placeholder={`Например: ${userSettings?.known_language_code === 'ru' ? 'яблоко' : userSettings?.known_language_code === 'en' ? 'apple' : userSettings?.known_language_code === 'es' ? 'manzana' : 'слово'}`}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.translation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {errors.translation && (
              <p className="mt-1 text-sm text-red-600">{errors.translation}</p>
            )}
          </div>

          {/* Image URL Field */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Изображение (необязательно)
            </label>
            <div className="relative">
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.imageUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>

          {/* Image Preview */}
          {formData.imageUrl && isValidUrl(formData.imageUrl) && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</p>
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {editCard ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};