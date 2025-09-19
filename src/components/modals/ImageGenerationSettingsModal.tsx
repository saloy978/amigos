import React, { useState } from 'react';
import { X, Settings, Image, Zap, Info } from 'lucide-react';
import { ImageGenerationService } from '../../services/imageGenerationService';

interface ImageGenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: {
    style: string;
    enabledServices: string[];
  }) => void;
  currentSettings?: {
    style: string;
    enabledServices: string[];
  };
}

export const ImageGenerationSettingsModal: React.FC<ImageGenerationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings = { style: 'cartoon', enabledServices: ['Unsplash', 'Pexels', 'Pixabay', 'Craiyon', 'Fallback'] }
}) => {
  const [style, setStyle] = useState(currentSettings.style);
  const [enabledServices, setEnabledServices] = useState<string[]>(currentSettings.enabledServices);

  const availableStyles = ImageGenerationService.getAvailableStyles();
  const availableServices = ImageGenerationService.getAvailableServices();

  const handleServiceToggle = (serviceName: string) => {
    setEnabledServices(prev => 
      prev.includes(serviceName) 
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleSave = () => {
    onSave({ style, enabledServices });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Настройки генерации изображений</h2>
              <p className="text-sm text-gray-600">Настройте стиль и сервисы для генерации изображений</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Style Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-600" />
            Стиль изображений
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {availableStyles.map((styleOption) => (
              <label
                key={styleOption.value}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  style === styleOption.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="style"
                  value={styleOption.value}
                  checked={style === styleOption.value}
                  onChange={(e) => setStyle(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="font-medium text-gray-900">{styleOption.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Services Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Доступные сервисы
          </h3>
          <div className="space-y-3">
            {availableServices.map((service) => (
              <label
                key={service.name}
                className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  enabledServices.includes(service.name)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enabledServices.includes(service.name)}
                    onChange={() => handleServiceToggle(service.name)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.description}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.free 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.free ? 'Бесплатно' : 'Платно'}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Как это работает:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Сервисы используются по приоритету (сверху вниз)</li>
                <li>• Если один сервис недоступен, автоматически используется следующий</li>
                <li>• Fallback всегда доступен как резервный вариант</li>
                <li>• Все сервисы бесплатные с ограничениями по количеству запросов</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
};



























