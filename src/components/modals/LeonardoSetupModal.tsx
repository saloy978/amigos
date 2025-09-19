import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface LeonardoSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeonardoSetupModal: React.FC<LeonardoSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        success: false,
        message: 'Пожалуйста, введите API ключ'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Здесь можно добавить валидацию API ключа
      // Пока просто сохраняем в localStorage
      localStorage.setItem('leonardo_api_key', apiKey);
      
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

  const handleClose = () => {
    setApiKey('');
    setValidationResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Настройка Leonardo.ai</h2>
              <p className="text-sm text-gray-600">Настройте API ключ для генерации изображений</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-2">Что такое Leonardo.ai?</p>
                <p className="text-blue-700 mb-3">
                  Leonardo.ai — это мощный сервис для генерации высококачественных изображений с помощью ИИ. 
                  Он создает уникальные изображения для ваших карточек изучения языков.
                </p>
                <a
                  href="https://leonardo.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Получить API ключ
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              API ключ Leonardo.ai
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите ваш API ключ..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500">
              Ваш API ключ будет сохранен локально и не передается третьим лицам
            </p>
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
                  <Check className="w-5 h-5 text-green-600" />
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

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3">Как получить API ключ:</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                <span>Перейдите на <a href="https://leonardo.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">leonardo.ai</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                <span>Зарегистрируйтесь или войдите в аккаунт</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                <span>Перейдите в раздел API и создайте новый ключ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                <span>Скопируйте ключ и вставьте в поле выше</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isValidating || !apiKey.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


























