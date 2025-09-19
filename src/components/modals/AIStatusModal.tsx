import React from 'react';
import { X, Brain, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ChatGPTService } from '../../services/chatgptService';
import { FreeAIService, FreeAIServiceEnum } from '../../services/freeAIService';
import { GoogleTranslateService } from '../../services/googleTranslateService';
import { getAvailableServices, getFirstAvailableService, getFirstAvailableImageService, getApiKey, isServiceEnabled } from '../../config/apiKeys';

interface AIStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIStatusModal: React.FC<AIStatusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const chatGPTStatus = ChatGPTService.getApiStatus();
  const freeAIStatus = FreeAIService.getServicesStatus();
  const availableServices = getAvailableServices();
  const firstAvailable = getFirstAvailableService();
  const firstAvailableImageService = getFirstAvailableImageService();

  const getServiceIcon = (serviceKey: string) => {
    switch (serviceKey) {
      case 'OPENAI': return '🤖';
      case 'GEMINI': return '💎';
      case 'HUGGING_FACE': return '🤗';
      case 'COHERE': return '🔮';
      case 'LEONARDO': return '🎨';
      case 'GOOGLE_TRANSLATE': return '🌍';
      default: return '🤖';
    }
  };

  const getServiceColor = (serviceKey: string) => {
    switch (serviceKey) {
      case 'OPENAI': return 'from-gray-500 to-gray-600';
      case 'GEMINI': return 'from-blue-500 to-indigo-600';
      case 'HUGGING_FACE': return 'from-purple-500 to-pink-500';
      case 'COHERE': return 'from-blue-500 to-cyan-500';
      case 'LEONARDO': return 'from-purple-500 to-blue-600';
      case 'GOOGLE_TRANSLATE': return 'from-blue-500 to-green-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getServiceStatus = (serviceKey: string) => {
    if (serviceKey === 'OPENAI') {
      return chatGPTStatus;
    }
    
    if (serviceKey === 'GEMINI') {
      const hasKey = !!getApiKey('GEMINI_API_KEY');
      const isEnabled = isServiceEnabled('GEMINI');
      return {
        configured: hasKey && isEnabled,
        hasKey: hasKey
      };
    }
    
    if (serviceKey === 'LEONARDO') {
      const hasKey = !!getApiKey('LEONARDO_API_KEY');
      const isEnabled = isServiceEnabled('LEONARDO');
      return {
        configured: hasKey && isEnabled,
        hasKey: hasKey
      };
    }
    
    if (serviceKey === 'GOOGLE_TRANSLATE') {
      const hasKey = !!getApiKey('GOOGLE_TRANSLATE_API_KEY');
      const isEnabled = isServiceEnabled('GOOGLE_TRANSLATE');
      return {
        configured: hasKey && isEnabled,
        hasKey: hasKey
      };
    }
    
    const serviceMap = {
      'HUGGING_FACE': FreeAIServiceEnum.HUGGING_FACE,
      'COHERE': FreeAIServiceEnum.COHERE
    };
    
    const service = serviceMap[serviceKey as keyof typeof serviceMap];
    return service ? freeAIStatus[service] : { configured: false, hasKey: false };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Статус AI сервисов
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
          {/* Current Services */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Текущие сервисы</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                <strong>Генерация слов:</strong> {firstAvailable 
                  ? `${availableServices.find(s => s.key === firstAvailable)?.name || 'Неизвестный сервис'}`
                  : 'Локальная система'
                }
              </p>
              <p className="text-sm text-blue-700">
                <strong>Генерация изображений:</strong> {firstAvailableImageService 
                  ? `${availableServices.find(s => s.key === firstAvailableImageService)?.name || 'Leonardo.ai'}`
                  : 'Fallback изображения'
                }
              </p>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {availableServices.map((service) => {
              const status = getServiceStatus(service.key);
              const isConfigured = status.configured;
              
              return (
                <div
                  key={service.key}
                  className={`p-4 border-2 rounded-xl ${
                    isConfigured 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getServiceColor(service.key)} rounded-lg flex items-center justify-center text-white text-lg`}>
                      {getServiceIcon(service.key)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConfigured ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Доступен</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Недоступен</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service.key !== 'OPENAI' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Бесплатно
                        </span>
                      )}
                      {service.key === 'OPENAI' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Платно
                        </span>
                      )}
                    </div>
                    {!isConfigured && (
                      <span className="text-xs text-gray-500">
                        API ключ не настроен
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Как это работает:</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <strong>1. Генерация слов:</strong> ChatGPT → Hugging Face → Cohere → Локальная система
              </div>
              <div>
                <strong>2. Генерация изображений:</strong> Leonardo.ai → Fallback изображения
              </div>
              <div>
                <strong>3. Автоматический выбор:</strong> Система автоматически выберет первый доступный сервис
              </div>
              <div>
                <strong>4. Fallback:</strong> При ошибках автоматически переключится на следующий доступный сервис
              </div>
              <div>
                <strong>5. Надежность:</strong> Локальная система всегда работает как последний fallback
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <strong>Примечание:</strong> API ключи настроены администратором и доступны всем пользователям.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
