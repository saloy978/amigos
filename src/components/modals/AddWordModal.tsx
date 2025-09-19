import React, { useState, useEffect } from 'react';
import { X, Volume2, Wand2, Languages, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { UserCardWithContent, CardState, ReviewDirection } from '../../types';
import { DatabaseService } from '../../services/database';
import { SpacedRepetitionAdapter } from '../../services/spacedRepetitionAdapter';
import { UserService } from '../../services/userService';
import { LeonardoImageGeneratorService } from '../../services/leonardoImageGenerator';
import { GoogleTranslateService } from '../../services/googleTranslateService';
import { ImageStorageService } from '../../services/imageStorageService';
import { logInfo, logError, logWarn } from '../../utils/browserLogger';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<UserCardWithContent, 'userId' | 'cardId' | 'createdAt' | 'updatedAt'>) => void;
  editCard?: UserCardWithContent | null;
  existingCards?: UserCardWithContent[];
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
    english: '',
    imageUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [userSettings] = useState(() => UserService.getUserSettings());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showEnglishField, setShowEnglishField] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    logInfo('🔄 AddWordModal: useEffect triggered', { editCard, isOpen }, 'AddWordModal');
    if (editCard) {
      logInfo('🔄 AddWordModal: Initializing form with editCard data', {
        term: editCard.term,
        translation: editCard.translation,
        imageUrl: editCard.imageUrl
      }, 'AddWordModal');
      setFormData({
        term: editCard.term,
        translation: editCard.translation,
        english: '', // English field removed from new schema
        imageUrl: editCard.imageUrl || ''
      });
    } else {
      logInfo('🔄 AddWordModal: Initializing form with empty data', null, 'AddWordModal');
      setFormData({
        term: '',
        translation: '',
        english: '',
        imageUrl: ''
      });
    }
    setErrors({});
    setDuplicateWarning('');
    setImageFile(null);
    setImagePreview('');
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
    
    const duplicate = SpacedRepetitionAdapter.checkForDuplicates(existingCards, formData.term.trim(), formData.translation.trim(), languagePairId);
    setDuplicateWarning(duplicate && duplicate.cardId !== editCard?.cardId ? `Похожая карточка уже существует: "${duplicate.term}" - "${duplicate.translation}"` : '');
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logInfo('🔄 AddWordModal: handleSubmit called', { editCard, formData, imageFile }, 'AddWordModal');
    
    if (!validateForm()) {
      logWarn('❌ AddWordModal: Form validation failed', null, 'AddWordModal');
      return;
    }

    let finalImageUrl = formData.imageUrl.trim() || undefined;

    // Если есть загруженный файл, загружаем его в Supabase Storage
    if (imageFile) {
      logInfo('🔄 AddWordModal: Uploading image file...', { fileName: imageFile.name, fileSize: imageFile.size }, 'AddWordModal');
      setIsUploadingImage(true);
      
      try {
        // Валидируем файл
        const validation = ImageStorageService.validateImageFile(imageFile);
        if (!validation.valid) {
          logError('❌ AddWordModal: File validation failed', validation, 'AddWordModal');
          setErrors(prev => ({ ...prev, imageUrl: validation.error || 'Invalid image file' }));
          setIsUploadingImage(false);
          return;
        }

        logInfo('🔄 AddWordModal: Converting image to WebP...', null, 'AddWordModal');
        // Конвертируем в WebP
        const webpBlob = await ImageStorageService.convertToWebP(imageFile);
        
        logInfo('🔄 AddWordModal: Uploading to Supabase Storage...', { 
          userId: userSettings?.user_id || 'anonymous',
          cardId: editCard?.cardId || Date.now()
        }, 'AddWordModal');
        
        // Загружаем в Supabase Storage
        const uploadResult = await ImageStorageService.uploadUserCardImage(
          webpBlob,
          userSettings?.user_id || 'anonymous',
          editCard?.cardId || Date.now(), // Используем cardId или временный ID
          {
            source: 'user_upload',
            original_filename: imageFile.name,
            uploaded_at: new Date().toISOString()
          }
        );

        finalImageUrl = uploadResult.url;
        logInfo('✅ AddWordModal: Image uploaded successfully', { finalImageUrl }, 'AddWordModal');
      } catch (error) {
        logError('❌ AddWordModal: Error uploading image', error, 'AddWordModal');
        setErrors(prev => ({ 
          ...prev, 
          imageUrl: 'Ошибка при загрузке изображения: ' + (error instanceof Error ? error.message : 'Unknown error')
        }));
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    const cardData: Omit<UserCardWithContent, 'userId' | 'cardId' | 'createdAt' | 'updatedAt'> = {
      term: formData.term.trim(),
      translation: formData.translation.trim(),
      imageUrl: finalImageUrl,
      languagePairId: editCard?.languagePairId || (() => {
        const pair = DatabaseService.getLanguagePair();
        return pair ? DatabaseService.generateLanguagePairId(
          pair.known_language_code,
          pair.learning_language_code
        ) : 'ru-en';
      })(),
      progress: editCard?.progress || 0,
      state: editCard?.state || CardState.LEARN,
      reviewCount: editCard?.reviewCount || 0,
      successfulReviews: editCard?.successfulReviews || 0,
      direction: editCard?.direction || ReviewDirection.KNOWN_TO_LEARNING,
      easeFactor: editCard?.easeFactor || 2.5,
      intervalDays: editCard?.intervalDays || 0,
      dueAt: editCard?.dueAt || new Date(),
      lastReviewedAt: editCard?.lastReviewedAt
    };

    logInfo('🔄 AddWordModal: Prepared cardData', cardData, 'AddWordModal');
    logInfo('🔄 AddWordModal: Calling onSave...', null, 'AddWordModal');
    onSave(cardData);
    logInfo('🔄 AddWordModal: Calling onClose...', null, 'AddWordModal');
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setTimeout(checkForDuplicates, 300); // Проверяем дубликаты с задержкой
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    logInfo('🔄 AddWordModal: File selected', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    }, 'AddWordModal');

    // Валидируем файл
    const validation = ImageStorageService.validateImageFile(file);
    if (!validation.valid) {
      logError('❌ AddWordModal: File validation failed', validation, 'AddWordModal');
      setErrors(prev => ({ ...prev, imageUrl: validation.error || 'Invalid image file' }));
      return;
    }

    setImageFile(file);
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setFormData(prev => ({ ...prev, imageUrl: result })); // Устанавливаем превью как URL
      logInfo('✅ AddWordModal: Image preview created', { previewSize: result.length }, 'AddWordModal');
    };
    reader.readAsDataURL(file);

    // Очищаем ошибки
    if (errors.imageUrl) {
      setErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleAutoTranslate = async () => {
    if (!formData.term.trim()) {
      setErrors(prev => ({ ...prev, translation: 'Сначала введите слово для перевода' }));
      return;
    }

    if (!GoogleTranslateService.isAvailable()) {
      alert('Google Translate API не настроен. Обратитесь к администратору для настройки.');
      return;
    }

    setIsTranslating(true);
    setErrors(prev => ({ ...prev, translation: '', english: '' }));

    try {
      console.log('🌍 Автоматический перевод слова:', formData.term);
      
      // Определяем исходный язык
      const sourceLanguage = userSettings?.learning_language_code || 'es';
      
      // Переводим на русский (известный язык)
      const translationResult = await GoogleTranslateService.translate({
        text: formData.term,
        sourceLanguage: sourceLanguage,
        targetLanguage: userSettings?.known_language_code || 'ru'
      });

      // Переводим на английский
      const englishResult = await GoogleTranslateService.translateToEnglish(
        formData.term,
        sourceLanguage
      );

      if (translationResult.success && englishResult.success) {
        setFormData(prev => ({
          ...prev,
          translation: translationResult.translatedText,
          english: englishResult.translatedText
        }));
        console.log('✅ Автоматический перевод успешен:');
        console.log(`"${formData.term}" → "${translationResult.translatedText}" → "${englishResult.translatedText}"`);
      } else {
        const errorMessages: string[] = [];
        if (!translationResult.success) errorMessages.push(`Перевод: ${translationResult.error}`);
        if (!englishResult.success) errorMessages.push(`Английский: ${englishResult.error}`);
        setErrors(prev => ({ ...prev, translation: errorMessages.join(', ') }));
      }
    } catch (error) {
      console.error('❌ Ошибка при автоматическом переводе:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setErrors(prev => ({ ...prev, translation: `Ошибка перевода: ${errorMessage}` }));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.term.trim()) {
      setErrors(prev => ({ ...prev, imageUrl: 'Сначала введите слово для генерации изображения' }));
      return;
    }

    setIsGeneratingImage(true);
    setErrors(prev => ({ ...prev, imageUrl: '', translation: '', english: '' }));

    try {
      console.log('🎨 Запуск процесса генерации изображения для слова:', formData.term);
      
      // Шаг 1: Автоматический перевод (если Google Translate доступен)
      if (GoogleTranslateService.isAvailable()) {
        console.log('🌍 Шаг 1: Автоматический перевод...');
        
        const sourceLanguage = userSettings?.learning_language_code || 'es';
        
        // Переводим на русский (известный язык)
        const translationResult = await GoogleTranslateService.translate({
          text: formData.term,
          sourceLanguage: sourceLanguage,
          targetLanguage: userSettings?.known_language_code || 'ru'
        });

        // Переводим на английский
        const englishResult = await GoogleTranslateService.translateToEnglish(
          formData.term,
          sourceLanguage
        );

        if (translationResult.success && englishResult.success) {
          setFormData(prev => ({
            ...prev,
            translation: translationResult.translatedText,
            english: englishResult.translatedText
          }));
          console.log('✅ Автоматический перевод успешен:');
          console.log(`"${formData.term}" → "${translationResult.translatedText}" → "${englishResult.translatedText}"`);
        } else {
          console.log('⚠️ Автоматический перевод не удался, продолжаем с исходным словом');
        }
      } else {
        console.log('⚠️ Google Translate недоступен, продолжаем без перевода');
      }

      // Шаг 2: Генерация изображения
      console.log('🎨 Шаг 2: Генерация изображения...');
      
      // Используем английское слово для генерации изображения
      const wordForGeneration = formData.english.trim() || formData.term.trim();
      
      const result = await LeonardoImageGeneratorService.generateImage({
        word: wordForGeneration,
        language: 'en', // Всегда используем английский для генерации изображений
        style: 'cartoon'
      });

      if (result.success && result.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl! }));
        console.log('✅ Изображение успешно сгенерировано:', result.imageUrl);
      } else {
        setErrors(prev => ({ ...prev, imageUrl: 'Не удалось сгенерировать изображение. Попробуйте позже.' }));
        console.error('❌ Ошибка генерации изображения:', result.error);
      }
    } catch (error) {
      console.error('❌ Ошибка при генерации изображения:', error);
      setErrors(prev => ({ ...prev, imageUrl: 'Произошла ошибка при генерации изображения' }));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editCard ? 'Редактировать' : 'Добавить слово'}
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
              {userSettings?.learning_language || 'Español'}
            </label>
            <div className="relative">
              <input
                type="text"
                id="term"
                value={formData.term}
                onChange={(e) => handleInputChange('term', e.target.value)}
                placeholder={`Например: ${userSettings?.learning_language_code === 'en' ? 'apple' : userSettings?.learning_language_code === 'es' ? 'manzana' : userSettings?.learning_language_code === 'fr' ? 'pomme' : 'word'}`}
                className={`w-full px-3 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.term ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {/* Auto Translate Icon */}
                {GoogleTranslateService.isAvailable() && (
                  <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={isTranslating || !formData.term.trim()}
                    className={`p-1 rounded transition-colors ${
                      isTranslating || !formData.term.trim()
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                    title="Автоматический перевод"
                  >
                    {isTranslating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <Languages className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {/* Volume Icon */}
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Произношение"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
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
              {userSettings?.known_language || 'Русский'}
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

          {/* English Field - Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowEnglishField(!showEnglishField)}
              className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>Английский</span>
              {showEnglishField ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showEnglishField && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    id="english"
                    value={formData.english}
                    onChange={(e) => handleInputChange('english', e.target.value)}
                    placeholder="Например: apple, house, car"
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.english ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.english && (
                  <p className="text-sm text-red-600">{errors.english}</p>
                )}
                
              </div>
            )}
          </div>

          {/* Image Upload and Generation Field */}
          <div>
            {/* File Upload Section */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Загрузить изображение
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition-colors cursor-pointer ${
                    isUploadingImage
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                >
                  {isUploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Загружаем изображение...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Выбрать файл</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Поддерживаются форматы: JPEG, PNG, WebP (макс. 5MB)
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">или</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
                       
            {/* Generate Image Button */}
            <div className="mb-3">
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !formData.term.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition-colors ${
                  isGeneratingImage || !formData.term.trim()
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-400'
                }`}
              >
                {isGeneratingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span>Переводим и генерируем...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Сгенерировать изображение</span>
                  </>
                )}
              </button>
            </div>
            
            
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>

          {/* Image Preview */}
          {(formData.imageUrl || imagePreview) && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Предварительный просмотр
              </label>
              <div className="w-full max-w-xs mx-auto">
                <img
                  src={imagePreview || formData.imageUrl}
                  alt="Preview"
                  className="w-full h-auto object-contain rounded-lg border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              {imageFile && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    Файл: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
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
              disabled={isUploadingImage}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isUploadingImage
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isUploadingImage ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Загружаем...
                </>
              ) : (
                editCard ? 'Сохранить' : 'Добавить'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};