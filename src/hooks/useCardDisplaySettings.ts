import { useState, useEffect, useCallback } from 'react';
import { CardDisplayConfigUtils, CARD_DISPLAY_CONFIG } from '../config/cardDisplayConfig';

/**
 * Хук для работы с настройками отображения карточек
 */
export const useCardDisplaySettings = () => {
  const [config, setConfig] = useState(CARD_DISPLAY_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Загружаем конфигурацию из localStorage при инициализации
  useEffect(() => {
    const savedConfig = localStorage.getItem('cardDisplayConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        CardDisplayConfigUtils.updateConfig(parsedConfig);
      } catch (error) {
        console.error('Ошибка загрузки конфигурации отображения карточек:', error);
      }
    }
  }, []);

  // Сохраняем конфигурацию в localStorage при изменении
  const saveConfig = useCallback((newConfig: typeof CARD_DISPLAY_CONFIG) => {
    setConfig(newConfig);
    CardDisplayConfigUtils.updateConfig(newConfig);
    localStorage.setItem('cardDisplayConfig', JSON.stringify(newConfig));
  }, []);

  // Получить режим отображения для карточки
  const getDisplayMode = useCallback((progress: number, reviewCount: number = 0) => {
    return CardDisplayConfigUtils.getDisplayMode(progress, reviewCount);
  }, []);

  // Получить конфигурацию режима
  const getModeConfig = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.getModeConfig(modeName);
  }, []);

  // Получить конфигурацию с учетом уровня сложности
  const getModeConfigWithDifficulty = useCallback((
    modeName: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) => {
    return CardDisplayConfigUtils.getModeConfigWithDifficulty(modeName, difficulty);
  }, []);

  // Проверить, нужно ли показывать перевод автоматически
  const shouldShowTranslationAutomatically = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.shouldShowTranslationAutomatically(modeName);
  }, []);

  // Получить задержку перед показом перевода
  const getTranslationDelay = useCallback((
    modeName: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) => {
    return CardDisplayConfigUtils.getTranslationDelay(modeName, difficulty);
  }, []);

  // Получить задержку перед возвратом к показу карточки после ответа
  const getCardReturnDelay = useCallback((
    modeName: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) => {
    return CardDisplayConfigUtils.getCardReturnDelay(modeName, difficulty);
  }, []);

  // Проверить, нужно ли показывать поле ввода
  const shouldShowInputField = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.shouldShowInputField(modeName);
  }, []);

  // Проверить, нужно ли показывать кнопки действий
  const shouldShowActionButtons = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.shouldShowActionButtons(modeName);
  }, []);

  // Проверить, требуются ли кнопки ввода для активации кнопок
  const requireInputForButtons = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.requireInputForButtons(modeName);
  }, []);

  // Получить количество нажатий Enter для перехода к следующей карточке
  const getEnterPressesToNext = useCallback((modeName: string) => {
    return CardDisplayConfigUtils.getEnterPressesToNext(modeName);
  }, []);

  // Получить все доступные режимы
  const getAllModes = useCallback(() => {
    return CardDisplayConfigUtils.getAllModes();
  }, []);

  // Получить общие настройки
  const getGeneralSettings = useCallback(() => {
    return CardDisplayConfigUtils.getGeneralSettings();
  }, []);

  // Проверить, нужно ли показывать индикатор прогресса
  const shouldShowProgressIndicator = useCallback(() => {
    return CardDisplayConfigUtils.shouldShowProgressIndicator();
  }, []);

  // Получить размер индикатора прогресса
  const getProgressIndicatorSize = useCallback(() => {
    return CardDisplayConfigUtils.getProgressIndicatorSize();
  }, []);

  // Проверить, нужно ли показывать процент в индикаторе прогресса
  const shouldShowProgressPercentage = useCallback(() => {
    return CardDisplayConfigUtils.shouldShowProgressPercentage();
  }, []);

  // Получить задержку после неправильного ответа
  const getIncorrectAnswerDelay = useCallback(() => {
    return CardDisplayConfigUtils.getIncorrectAnswerDelay();
  }, []);

  // Получить увеличение прогресса за правильный ответ
  const getProgressIncrease = useCallback(() => {
    return CardDisplayConfigUtils.getProgressIncrease();
  }, []);

  // Получить уменьшение прогресса за неправильный ответ
  const getProgressDecrease = useCallback(() => {
    return CardDisplayConfigUtils.getProgressDecrease();
  }, []);

  // Получить порог для сброса счетчика успешных повторений
  const getResetSuccessfulReviewsThreshold = useCallback(() => {
    return CardDisplayConfigUtils.getResetSuccessfulReviewsThreshold();
  }, []);

  // Получить интервалы повторений
  const getReviewIntervals = useCallback(() => {
    return CardDisplayConfigUtils.getReviewIntervals();
  }, []);

  // Получить следующий интервал повторения
  const getNextReviewInterval = useCallback((successfulReviews: number) => {
    return CardDisplayConfigUtils.getNextReviewInterval(successfulReviews);
  }, []);

  // Сбросить конфигурацию к значениям по умолчанию
  const resetConfig = useCallback(() => {
    setConfig(CARD_DISPLAY_CONFIG);
    CardDisplayConfigUtils.updateConfig(CARD_DISPLAY_CONFIG);
    localStorage.removeItem('cardDisplayConfig');
  }, []);

  // Открыть модальное окно настроек
  const openSettingsModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Закрыть модальное окно настроек
  const closeSettingsModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Обработчик сохранения настроек
  const handleSaveSettings = useCallback((newConfig: typeof CARD_DISPLAY_CONFIG) => {
    saveConfig(newConfig);
    closeSettingsModal();
  }, [saveConfig, closeSettingsModal]);

  return {
    // Состояние
    config,
    isModalOpen,
    
    // Методы для работы с режимами
    getDisplayMode,
    getModeConfig,
    getModeConfigWithDifficulty,
    shouldShowTranslationAutomatically,
    getTranslationDelay,
    getCardReturnDelay,
    shouldShowInputField,
    shouldShowActionButtons,
    requireInputForButtons,
    getEnterPressesToNext,
    getAllModes,
    getGeneralSettings,
    
    // Методы для работы с индикатором прогресса
    shouldShowProgressIndicator,
    getProgressIndicatorSize,
    shouldShowProgressPercentage,
    
    // Методы для работы с интервальными повторениями
    getIncorrectAnswerDelay,
    getProgressIncrease,
    getProgressDecrease,
    getResetSuccessfulReviewsThreshold,
    getReviewIntervals,
    getNextReviewInterval,
    
    // Методы для управления настройками
    saveConfig,
    resetConfig,
    openSettingsModal,
    closeSettingsModal,
    handleSaveSettings,
  };
};
