/**
 * Примеры конфигураций для отображения карточек
 * 
 * Этот файл содержит различные предустановленные конфигурации,
 * которые можно использовать для быстрой настройки приложения.
 */

import { CardDisplaySettings } from './cardDisplayConfig';

/**
 * Конфигурация для начинающих пользователей
 * - Больше времени на размышление
 * - Автоматический показ переводов
 * - Упрощенный интерфейс
 */
export const BEGINNER_CONFIG: Partial<CardDisplaySettings> = {
  modes: {
    DEMONSTRATION: {
      name: 'Демонстрация',
      description: 'Автоматический показ перевода через 3 секунды',
      minProgress: 0,
      maxProgress: 29, // Увеличиваем диапазон для начинающих
      showTranslationAutomatically: true,
      translationDelay: 3000, // Больше времени
      cardReturnDelay: 4000, // Больше времени перед переходом к следующей карточке
      showInputField: false,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    WORD: {
      name: 'Слово',
      description: 'Показывается слово, перевод по тапу на карточку',
      minProgress: 30,
      maxProgress: 59, // Увеличиваем диапазон
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: true,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    TRANSLATION: {
      name: 'Перевод',
      description: 'Показывается перевод, слово по тапу на карточку',
      minProgress: 60,
      maxProgress: 79,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: true,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
      alternatesWith: ['WORD'],
      alternateCondition: 'even',
    },
  },
  general: {
    cardAnimation: true,
    animationDuration: 500, // Медленнее анимация
    soundEffects: true,
    visualFeedback: true,
    autoSaveProgress: true,
    autoSaveInterval: 3000, // Чаще автосохранение
    showProgressIndicator: true,
    progressIndicatorSize: 40,
    showProgressPercentage: true,
  }
};

/**
 * Конфигурация для продвинутых пользователей
 * - Быстрые переходы
 * - Минимум помощи
 * - Сложные режимы
 */
export const ADVANCED_CONFIG: Partial<CardDisplaySettings> = {
  modes: {
    DEMONSTRATION: {
      name: 'Демонстрация',
      description: 'Автоматический показ перевода через 0.5 секунды',
      minProgress: 0,
      maxProgress: 9, // Уменьшаем диапазон
      showTranslationAutomatically: true,
      translationDelay: 500, // Быстрее
      cardReturnDelay: 800, // Быстрее переход
      showInputField: false,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    WORD: {
      name: 'Слово',
      description: 'Показывается слово, перевод по тапу на карточку',
      minProgress: 10,
      maxProgress: 39, // Уменьшаем диапазон
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: true,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    TRANSLATION: {
      name: 'Перевод',
      description: 'Показывается перевод, слово по тапу на карточку',
      minProgress: 40,
      maxProgress: 59, // Уменьшаем диапазон
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: true,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
      alternatesWith: ['WORD'],
      alternateCondition: 'even',
    },
  },
  general: {
    cardAnimation: true,
    animationDuration: 200, // Быстрее анимация
    soundEffects: false, // Отключаем звуки для продвинутых
    visualFeedback: true,
    autoSaveProgress: true,
    autoSaveInterval: 10000, // Реже автосохранение
    showProgressIndicator: true,
    progressIndicatorSize: 32,
    showProgressPercentage: false,
  }
};

/**
 * Конфигурация для быстрого изучения
 * - Минимум времени на карточку
 * - Быстрые переходы
 * - Фокус на повторении
 */
export const SPEED_CONFIG: Partial<CardDisplaySettings> = {
  modes: {
    DEMONSTRATION: {
      name: 'Демонстрация',
      description: 'Автоматический показ перевода через 0.3 секунды',
      minProgress: 0,
      maxProgress: 14,
      showTranslationAutomatically: true,
      translationDelay: 300, // Очень быстро
      cardReturnDelay: 500, // Очень быстро
      showInputField: false,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    WORD: {
      name: 'Слово',
      description: 'Показывается слово, перевод по тапу на карточку',
      minProgress: 15,
      maxProgress: 49,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: true,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    TRANSLATION: {
      name: 'Перевод',
      description: 'Показывается перевод, слово по тапу на карточку',
      minProgress: 50,
      maxProgress: 69,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: true,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
      alternatesWith: ['WORD'],
      alternateCondition: 'even',
    },
  },
  general: {
    cardAnimation: false, // Отключаем анимации для скорости
    animationDuration: 100,
    soundEffects: false,
    visualFeedback: false, // Минимум обратной связи
    autoSaveProgress: true,
    autoSaveInterval: 5000,
    showProgressIndicator: false, // Скрываем индикатор для скорости
    progressIndicatorSize: 28,
    showProgressPercentage: false,
  }
};

/**
 * Конфигурация для детального изучения
 * - Максимум времени на карточку
 * - Подробная обратная связь
 * - Множественные проверки
 */
export const DETAILED_CONFIG: Partial<CardDisplaySettings> = {
  modes: {
    DEMONSTRATION: {
      name: 'Демонстрация',
      description: 'Автоматический показ перевода через 5 секунд',
      minProgress: 0,
      maxProgress: 24,
      showTranslationAutomatically: true,
      translationDelay: 5000, // Много времени
      cardReturnDelay: 6000, // Много времени перед переходом
      showInputField: false,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    WORD: {
      name: 'Слово',
      description: 'Показывается слово, перевод по тапу на карточку',
      minProgress: 25,
      maxProgress: 49,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: true,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
    },
    TRANSLATION: {
      name: 'Перевод',
      description: 'Показывается перевод, слово по тапу на карточку',
      minProgress: 50,
      maxProgress: 74,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // Стандартное время
      showInputField: false,
      showActionButtons: true,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: true,
      nextCardOnEnter: false,
      nextCardOnTap: false,
      enterPressesToNext: 0,
      alternatesWith: ['WORD'],
      alternateCondition: 'even',
    },
  },
  general: {
    cardAnimation: true,
    animationDuration: 800, // Медленная анимация
    soundEffects: true,
    visualFeedback: true,
    autoSaveProgress: true,
    autoSaveInterval: 2000, // Частое автосохранение
    showProgressIndicator: true,
    progressIndicatorSize: 44,
    showProgressPercentage: true,
  }
};

/**
 * Утилиты для работы с предустановленными конфигурациями
 */
export class ConfigPresets {
  /**
   * Применить предустановленную конфигурацию
   */
  static applyPreset(preset: 'beginner' | 'advanced' | 'speed' | 'detailed'): Partial<CardDisplaySettings> {
    switch (preset) {
      case 'beginner':
        return BEGINNER_CONFIG;
      case 'advanced':
        return ADVANCED_CONFIG;
      case 'speed':
        return SPEED_CONFIG;
      case 'detailed':
        return DETAILED_CONFIG;
      default:
        return {};
    }
  }

  /**
   * Получить список доступных предустановок
   */
  static getAvailablePresets() {
    return [
      { id: 'beginner', name: 'Для начинающих', description: 'Больше времени, проще интерфейс' },
      { id: 'advanced', name: 'Для продвинутых', description: 'Быстрые переходы, минимум помощи' },
      { id: 'speed', name: 'Быстрое изучение', description: 'Минимум времени на карточку' },
      { id: 'detailed', name: 'Детальное изучение', description: 'Максимум времени и обратной связи' }
    ];
  }

  /**
   * Получить описание предустановки
   */
  static getPresetDescription(preset: string): string {
    const presets = this.getAvailablePresets();
    const found = presets.find(p => p.id === preset);
    return found?.description || 'Неизвестная предустановка';
  }
}
