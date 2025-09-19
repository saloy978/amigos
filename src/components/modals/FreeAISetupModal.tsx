import React, { useState } from 'react';
import { X, Brain, Save, TestTube, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { FreeAIService, FreeAIService as Service } from '../../services/freeAIService';

interface FreeAISetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeAISetupModal: React.FC<FreeAISetupModalProps> = ({ isOpen, onClose }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  if (!isOpen) return null;

  const servicesInfo = FreeAIService.getServicesInfo();
  const servicesStatus = FreeAIService.getServicesStatus();

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setApiKey('');
    setTestResult(null);
  };

  const handleSaveKey = () => {
    if (selectedService && apiKey.trim()) {
      FreeAIService.setApiKey(selectedService, apiKey.trim());
      alert(`API ключ для ${servicesInfo[selectedService].name} сохранен!`);
      onClose();
    } else {
      alert('Пожалуйста, выберите сервис и введите API ключ');
    }
  };

  const handleTestConnection = async () => {
    if (!selectedService || !apiKey.trim()) {
      alert('Пожалуйста, выберите сервис и введите API ключ для тестирования');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Временно устанавливаем ключ для тестирования
      FreeAIService.setApiKey(selectedService, apiKey.trim());
      
      const result = await FreeAIService.testConnection(selectedService);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message || 'Ошибка тестирования'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getServiceIcon = (service: Service) => {
    switch (service) {
      case Service.HUGGING_FACE: return '🤗';
      case Service.COHERE: return '🔮';
      case Service.YANDEX_GPT: return '🟡';
      case Service.GIGACHAT: return '💚';
      default: return '🤖';
    }
  };

  const getServiceColor = (service: Service) => {
    switch (service) {
      case Service.HUGGING_FACE: return 'from-purple-500 to-pink-500';
      case Service.COHERE: return 'from-blue-500 to-cyan-500';
      case Service.YANDEX_GPT: return 'from-yellow-500 to-orange-500';
      case Service.GIGACHAT: return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Бесплатные AI сервисы
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
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(servicesInfo).map(([service, info]) => {
              const serviceKey = service as Service;
              const status = servicesStatus[serviceKey];
              const isSelected = selectedService === serviceKey;
              
              return (
                <div
                  key={service}
                  onClick={() => handleServiceSelect(serviceKey)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getServiceColor(serviceKey)} rounded-lg flex items-center justify-center text-white text-lg`}>
                      {getServiceIcon(serviceKey)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{info.name}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.configured ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Настроено</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Не настроено</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {info.free && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Бесплатно
                        </span>
                      )}
                    </div>
                    <a
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Документация
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* API Key Input */}
          {selectedService && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Настройка {servicesInfo[selectedService].name}
              </h3>
              
              <div className="mb-4">
                <label htmlFor="free-ai-key" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  id="free-ai-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите API ключ..."
                />
              </div>

              {/* Test and Save Buttons */}
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
                <div className={`mt-4 rounded-lg p-3 ${
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
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Как получить API ключи:</h4>
            <div className="space-y-2 text-xs text-blue-700">
              <div>
                <strong>🤗 Hugging Face:</strong> Зарегистрируйтесь на huggingface.co, перейдите в Settings → Access Tokens
              </div>
              <div>
                <strong>🔮 Cohere:</strong> Зарегистрируйтесь на cohere.ai, получите бесплатный ключ (1000 запросов/месяц)
              </div>
              <div>
                <strong>🟡 YandexGPT:</strong> Зарегистрируйтесь на yandex.ru/dev/gpt, создайте API ключ
              </div>
              <div>
                <strong>💚 GigaChat:</strong> Зарегистрируйтесь на developers.sber.ru, получите доступ к GigaChat API
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              <strong>Важно:</strong> API ключи хранятся только в памяти браузера и не передаются на серверы.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



























