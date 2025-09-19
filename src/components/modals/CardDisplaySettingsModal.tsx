import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Settings } from 'lucide-react';
import { CardDisplayConfigUtils, CARD_DISPLAY_CONFIG } from '../../config/cardDisplayConfig';

interface CardDisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: any) => void;
}

export const CardDisplaySettingsModal: React.FC<CardDisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState(CARD_DISPLAY_CONFIG);
  const [activeTab, setActiveTab] = useState<'modes' | 'general' | 'spacedRepetition' | 'difficulty'>('modes');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(CARD_DISPLAY_CONFIG);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleConfigChange = (path: string, value: any) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    CardDisplayConfigUtils.updateConfig(config);
    setHasChanges(false);
    onSave?.(config);
  };

  const handleReset = () => {
    setConfig(CARD_DISPLAY_CONFIG);
    setHasChanges(true);
  };

  const renderModeSettings = () => {
    return (
      <div className="space-y-6">
        {Object.entries(config.modes).map(([modeName, modeConfig]) => (
          <div key={modeName} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              {modeConfig.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{modeConfig.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Минимальный прогресс (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={modeConfig.minProgress}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.minProgress`, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Максимальный прогресс (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={modeConfig.maxProgress}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.maxProgress`, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Задержка показа перевода (мс)
                </label>
                <input
                  type="number"
                  min="0"
                  value={modeConfig.translationDelay}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.translationDelay`, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Задержка возврата к карточке (мс)
                </label>
                <input
                  type="number"
                  min="0"
                  value={modeConfig.cardReturnDelay}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.cardReturnDelay`, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нажатий Enter для следующей карточки
                </label>
                <input
                  type="number"
                  min="0"
                  value={modeConfig.enterPressesToNext}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.enterPressesToNext`, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.showTranslationAutomatically}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.showTranslationAutomatically`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать перевод автоматически</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.showInputField}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.showInputField`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать поле ввода</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.showActionButtons}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.showActionButtons`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать кнопки действий</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.requireInputForButtons}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.requireInputForButtons`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Требовать ввод для активации кнопок</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.showTranslationOnTap}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.showTranslationOnTap`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать перевод по тапу</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.showWordOnTap}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.showWordOnTap`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать слово по тапу</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.nextCardOnEnter}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.nextCardOnEnter`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Переход к следующей карточке по Enter</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={modeConfig.nextCardOnTap}
                  onChange={(e) => handleConfigChange(`modes.${modeName}.nextCardOnTap`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Переход к следующей карточке по тапу</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGeneralSettings = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Длительность анимации (мс)
          </label>
          <input
            type="number"
            min="0"
            value={config.general.animationDuration}
            onChange={(e) => handleConfigChange('general.animationDuration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Интервал автосохранения (мс)
          </label>
          <input
            type="number"
            min="1000"
            value={config.general.autoSaveInterval}
            onChange={(e) => handleConfigChange('general.autoSaveInterval', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Размер индикатора прогресса (px)
          </label>
          <input
            type="number"
            min="20"
            max="60"
            value={config.general.progressIndicatorSize}
            onChange={(e) => handleConfigChange('general.progressIndicatorSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.cardAnimation}
              onChange={(e) => handleConfigChange('general.cardAnimation', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Анимация появления карточки</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.soundEffects}
              onChange={(e) => handleConfigChange('general.soundEffects', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Звуковые эффекты</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.visualFeedback}
              onChange={(e) => handleConfigChange('general.visualFeedback', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Визуальная обратная связь</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.autoSaveProgress}
              onChange={(e) => handleConfigChange('general.autoSaveProgress', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Автоматическое сохранение прогресса</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.showProgressIndicator}
              onChange={(e) => handleConfigChange('general.showProgressIndicator', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Показывать индикатор прогресса на карточке</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.general.showProgressPercentage}
              onChange={(e) => handleConfigChange('general.showProgressPercentage', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Показывать процент в индикаторе прогресса</span>
          </label>
        </div>
      </div>
    );
  };

  const renderSpacedRepetitionSettings = () => {
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Настройки интервальных повторений
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Задержка после неправильного ответа (мс)
              </label>
              <input
                type="number"
                min="1000"
                value={config.spacedRepetition.incorrectAnswerDelay}
                onChange={(e) => handleConfigChange('spacedRepetition.incorrectAnswerDelay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Время, через которое карточка вернется для повторного изучения после неправильного ответа
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Увеличение прогресса за правильный ответ (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.spacedRepetition.progressIncrease}
                onChange={(e) => handleConfigChange('spacedRepetition.progressIncrease', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Уменьшение прогресса за неправильный ответ (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.spacedRepetition.progressDecrease}
                onChange={(e) => handleConfigChange('spacedRepetition.progressDecrease', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порог для сброса счетчика успешных повторений (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.spacedRepetition.resetSuccessfulReviewsThreshold}
                onChange={(e) => handleConfigChange('spacedRepetition.resetSuccessfulReviewsThreshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                При прогрессе ниже этого значения счетчик успешных повторений будет сброшен
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Интервалы повторений
          </h3>
          
          <div className="space-y-3">
            {config.spacedRepetition.reviewIntervals.map((interval, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600 w-20">
                  {index + 1}-й ответ:
                </span>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={interval.minutes || 0}
                    onChange={(e) => {
                      const newIntervals = [...config.spacedRepetition.reviewIntervals];
                      newIntervals[index] = { ...interval, minutes: parseInt(e.target.value) || undefined };
                      handleConfigChange('spacedRepetition.reviewIntervals', newIntervals);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="мин"
                  />
                  <span className="text-sm text-gray-500">мин</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={interval.hours || 0}
                    onChange={(e) => {
                      const newIntervals = [...config.spacedRepetition.reviewIntervals];
                      newIntervals[index] = { ...interval, hours: parseInt(e.target.value) || undefined };
                      handleConfigChange('spacedRepetition.reviewIntervals', newIntervals);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="час"
                  />
                  <span className="text-sm text-gray-500">час</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={interval.days || 0}
                    onChange={(e) => {
                      const newIntervals = [...config.spacedRepetition.reviewIntervals];
                      newIntervals[index] = { ...interval, days: parseInt(e.target.value) || undefined };
                      handleConfigChange('spacedRepetition.reviewIntervals', newIntervals);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="дн"
                  />
                  <span className="text-sm text-gray-500">дн</span>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Интервалы определяют, через сколько времени карточка вернется для повторного изучения после правильного ответа
          </p>
        </div>
      </div>
    );
  };

  const renderDifficultySettings = () => {
    return (
      <div className="space-y-6">
        {Object.entries(config.difficulty).map(([difficulty, settings]) => (
          <div key={difficulty} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 capitalize">
              {difficulty === 'beginner' ? 'Начинающий' : 
               difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
            </h3>
            
            <div className="space-y-2">
              {settings.translationDelay !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Задержка показа перевода (мс)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.translationDelay}
                    onChange={(e) => handleConfigChange(`difficulty.${difficulty}.translationDelay`, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {settings.cardReturnDelay !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Задержка возврата к карточке (мс)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.cardReturnDelay}
                    onChange={(e) => handleConfigChange(`difficulty.${difficulty}.cardReturnDelay`, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {settings.enterPressesToNext !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Нажатий Enter для следующей карточки
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.enterPressesToNext}
                    onChange={(e) => handleConfigChange(`difficulty.${difficulty}.enterPressesToNext`, parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showActionButtons || false}
                  onChange={(e) => handleConfigChange(`difficulty.${difficulty}.showActionButtons`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать кнопки действий</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.requireInputForButtons || false}
                  onChange={(e) => handleConfigChange(`difficulty.${difficulty}.requireInputForButtons`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Требовать ввод для активации кнопок</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.nextCardOnEnter || false}
                  onChange={(e) => handleConfigChange(`difficulty.${difficulty}.nextCardOnEnter`, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Переход к следующей карточке по Enter</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Настройки отображения карточек
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'modes', label: 'Режимы отображения' },
            { id: 'general', label: 'Общие настройки' },
            { id: 'spacedRepetition', label: 'Интервальные повторения' },
            { id: 'difficulty', label: 'Настройки сложности' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'modes' && renderModeSettings()}
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'spacedRepetition' && renderSpacedRepetitionSettings()}
          {activeTab === 'difficulty' && renderDifficultySettings()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
