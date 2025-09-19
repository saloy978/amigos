import React, { useState } from 'react';
import { X, KeyRound, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { ChatGPTService } from '../../services/chatgptService';

interface ChatGPTSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatGPTSetupModal: React.FC<ChatGPTSetupModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      ChatGPTService.setApiKey(apiKey.trim());
      alert('API ключ сохранен!');
      onClose();
    } else {
      alert('Пожалуйста, введите API ключ');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert('Пожалуйста, введите API ключ для тестирования');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Временно устанавливаем ключ для тестирования
      const originalKey = ChatGPTService.getApiStatus().hasKey;
      ChatGPTService.setApiKey(apiKey.trim());
      
      const result = await ChatGPTService.testConnection();
      setTestResult(result);
      
      // Восстанавливаем оригинальный ключ если тест не прошел
      if (!result.success && !originalKey) {
        ChatGPTService.setApiKey('');
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message || 'Ошибка тестирования'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const apiStatus = ChatGPTService.getApiStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Настройка ChatGPT API
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Статус:</span>
              {apiStatus.configured ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Настроено</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Не настроено</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              ChatGPT API позволяет генерировать более разнообразные и актуальные слова.
              Если API не настроен, будет использоваться встроенная система генерации.
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <label htmlFor="chatgpt-key" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="chatgpt-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Получите ключ на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Тестируем...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Тестировать
                </>
              )}
            </button>
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg p-3 ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? 'Подключение успешно!' : 'Ошибка подключения'}
                </span>
              </div>
              {testResult.error && (
                <p className="text-xs text-red-600 mt-1">{testResult.error}</p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Как получить API ключ:</h4>
            <ol className="text-xs text-blue-700 space-y-1">
              <li>1. Зарегистрируйтесь на <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
              <li>2. Перейдите в раздел "API Keys"</li>
              <li>3. Создайте новый ключ</li>
              <li>4. Скопируйте ключ (начинается с "sk-")</li>
              <li>5. Вставьте ключ в поле выше</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Важно:</strong> API ключ хранится только в памяти браузера и не передается на серверы.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



























