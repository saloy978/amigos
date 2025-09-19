import React, { useState } from 'react';
import { X, Key, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { getApiKey, isServiceEnabled } from '../../config/apiKeys';

interface ImageApiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageApiSetupModal: React.FC<ImageApiSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [leonardoKey, setLeonardoKey] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSaveKeys = async () => {
    if (!leonardoKey.trim()) {
      setValidationResult({
        success: false,
        message: 'Пожалуйста, введите API ключ Leonardo.ai'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Сохраняем ключ в localStorage
      localStorage.setItem('leonardo_api_key', leonardoKey);
      
      setValidationResult({
        success: true,
        message: 'API ключ успешно сохранен!'
      });

      // Закрываем модал через 2 секунды
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Ошибка при сохранении API ключа'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const leonardoEnabled = isServiceEnabled('LEONARDO');
  const leonardoKeyExists = !!getApiKey('LEONARDO_API_KEY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Настройка Leonardo.ai
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Current Status */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Текущий статус API
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {leonardoKeyExists ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm">Leonardo.ai API: {leonardoKeyExists ? 'Настроен' : 'Не настроен'}</span>
              </div>
            </div>
          </div>

          {/* Instructions Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              {showInstructions ? 'Скрыть инструкции' : 'Показать инструкции по настройке'}
            </button>
          </div>

          {/* Instructions */}
          {showInstructions && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-3">Инструкции по настройке Leonardo.ai</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>1. Перейдите на <a href="https://leonardo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">leonardo.ai</a></p>
                <p>2. Зарегистрируйтесь или войдите в аккаунт</p>
                <p>3. Перейдите в раздел API и создайте новый ключ</p>
                <p>4. Скопируйте ключ и вставьте в поле ниже</p>
              </div>
            </div>
          )}

          {/* API Keys Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leonardo.ai API Key
              </label>
              <input
                type="password"
                value={leonardoKey}
                onChange={(e) => setLeonardoKey(e.target.value)}
                placeholder="Введите ваш Leonardo.ai API Key"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Получите ключ на <a href="https://leonardo.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">leonardo.ai</a>
              </p>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-xl border ${
              validationResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {validationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  validationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Fallback Info */}
          <div className="bg-yellow-50 rounded-xl p-4 mt-6">
            <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Без API ключа
            </h3>
            <p className="text-sm text-yellow-800">
              Если API ключ Leonardo.ai не настроен, система будет использовать fallback изображения, 
              подобранные по категориям слов (животные, еда, природа, предметы, люди).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveKeys}
              disabled={!leonardoKey.trim() || isValidating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить ключ'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

