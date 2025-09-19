/**
 * Конфигурация отображения карточек
 * 
 * Этот файл содержит все настройки для различных режимов отображения карточек.
 * Легко изменяйте параметры для настройки поведения приложения.
 */

export interface CardDisplayModeConfig {
  /** Название режима */
  name: string;
  /** Описание режима */
  description: string;
  /** Минимальный прогресс для активации режима */
  minProgress: number;
  /** Максимальный прогресс для активации режима */
  maxProgress: number;
  /** Показывать ли перевод автоматически */
  showTranslationAutomatically: boolean;
  /** Задержка перед показом перевода (в миллисекундах) */
  translationDelay: number;
  /** Задержка перед возвратом к показу карточки после ответа (в миллисекундах) */
  cardReturnDelay: number;
  /** Показывать ли поле ввода */
  showInputField: boolean;
  /** Показывать ли кнопки "Знаю"/"Не знаю" */
  showActionButtons: boolean;
  /** Показывать ли кнопки только при наличии текста в поле ввода */
  requireInputForButtons: boolean;
  /** Показывать ли перевод по тапу на карточку */
  showTranslationOnTap: boolean;
  /** Показывать ли слово по тапу на карточку */
  showWordOnTap: boolean;
  /** Переход к следующей карточке по Enter */
  nextCardOnEnter: boolean;
  /** Переход к следующей карточке по тапу */
  nextCardOnTap: boolean;
  /** Количество нажатий Enter для перехода к следующей карточке */
  enterPressesToNext: number;
  /** Чередование с другими режимами */
  alternatesWith?: string[];
  /** Условие чередования (четность reviewCount) */
  alternateCondition?: 'even' | 'odd';
}

export interface CardDisplaySettings {
  /** Основные режимы отображения */
  modes: Record<string, CardDisplayModeConfig>;
  /** Общие настройки */
  general: {
    /** Анимация появления карточки */
    cardAnimation: boolean;
    /** Длительность анимации (мс) */
    animationDuration: number;
    /** Звуковые эффекты */
    soundEffects: boolean;
    /** Визуальная обратная связь */
    visualFeedback: boolean;
    /** Автоматическое сохранение прогресса */
    autoSaveProgress: boolean;
    /** Интервал автосохранения (мс) */
    autoSaveInterval: number;
    /** Показывать индикатор прогресса на карточке */
    showProgressIndicator: boolean;
    /** Размер индикатора прогресса */
    progressIndicatorSize: number;
    /** Показывать процент в индикаторе прогресса */
    showProgressPercentage: boolean;
  };
  /** Настройки интервальных повторений */
  spacedRepetition: {
    /** Задержка после неправильного ответа (мс) */
    incorrectAnswerDelay: number;
    /** Увеличение прогресса за правильный ответ (%) */
    progressIncrease: number;
    /** Уменьшение прогресса за неправильный ответ (%) */
    progressDecrease: number;
    /** Сброс счетчика успешных повторений при низком прогрессе */
    resetSuccessfulReviewsThreshold: number;
    /** Интервалы повторений (в порядке возрастания) */
    reviewIntervals: Array<{
      /** Количество минут */
      minutes?: number;
      /** Количество часов */
      hours?: number;
      /** Количество дней */
      days?: number;
    }>;
  };
  /** Настройки для разных уровней сложности */
  difficulty: {
    /** Настройки для начинающих */
    beginner: Partial<CardDisplayModeConfig>;
    /** Настройки для среднего уровня */
    intermediate: Partial<CardDisplayModeConfig>;
    /** Настройки для продвинутых */
    advanced: Partial<CardDisplayModeConfig>;
  };
}

/**
 * Основная конфигурация отображения карточек
 * 
 * Легко изменяйте эти настройки для настройки поведения приложения
 */
export const CARD_DISPLAY_CONFIG: CardDisplaySettings = {
  modes: {
    DEMONSTRATION: {
      name: 'Демонстрация',
      description: 'Автоматический показ перевода через 1.5 секунды',
      minProgress: 0,
      maxProgress: 19,
      showTranslationAutomatically: true,
      translationDelay: 1500,
      cardReturnDelay: 2000, // 2 секунды перед переходом к следующей карточке
      showInputField: false,
      showActionButtons: true,
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
      minProgress: 20,
      maxProgress: 29,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 1500, // 1.5 секунды перед переходом к следующей карточке
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
      minProgress: 30,
      maxProgress: 49,
      showTranslationAutomatically: true, // Показываем русский перевод автоматически
      translationDelay: 0,
      cardReturnDelay: 1500, // 1.5 секунды перед переходом к следующей карточке
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
    
    
    TRANSLATION_TO_WORD: {
      name: 'Перевод к слову',
      description: 'Пользователь видит испанское слово, вводит русский перевод, перевод показывается по тапу',
      minProgress: 50,
      maxProgress: 69,
      showTranslationAutomatically: false, // Перевод показывается по тапу
      translationDelay: 0,
      cardReturnDelay: 2000, // 2 секунды перед переходом к следующей карточке
      showInputField: true,
      showActionButtons: true,
      requireInputForButtons: true,
      showTranslationOnTap: true, // Перевод показывается по тапу
      showWordOnTap: false,
      nextCardOnEnter: true,
      nextCardOnTap: true,
      enterPressesToNext: 2, // Первое нажатие показывает правильный ответ, второе - следующая карточка
      alternatesWith: ['TRANSLATION'],
      alternateCondition: 'even',
    },

    LISTENING_1: {
      name: 'Аудирование-1',
      description: 'Произносится слово, по тапу показывается картинка, слово и перевод',
      minProgress: 70,
      maxProgress: 84,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 0, // Нет задержки, переход происходит сразу после показа контента
      showInputField: false,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: false,
      nextCardOnTap: true, // Тап показывает контент и переводит к следующей карточке
      enterPressesToNext: 0,
      alternatesWith: ['LISTENING_2'],
      alternateCondition: 'even',
    },

    LISTENING_2: {
      name: 'Аудирование-2',
      description: 'Произносится слово, пользователь вводит услышанное слово',
      minProgress: 85,
      maxProgress: 100,
      showTranslationAutomatically: false,
      translationDelay: 0,
      cardReturnDelay: 2000, // 2 секунды перед переходом к следующей карточке
      showInputField: true,
      showActionButtons: false,
      requireInputForButtons: false,
      showTranslationOnTap: false,
      showWordOnTap: false,
      nextCardOnEnter: true,
      nextCardOnTap: true, // Тап переводит к следующей карточке после валидации
      enterPressesToNext: 2, // Первое нажатие показывает результат, второе - следующая карточка
      alternatesWith: ['LISTENING_1'],
      alternateCondition: 'odd',
    }
  },

  general: {
    cardAnimation: true,
    animationDuration: 300,
    soundEffects: true,
    visualFeedback: true,
    autoSaveProgress: true,
    autoSaveInterval: 5000,
    showProgressIndicator: true,
    progressIndicatorSize: 36,
    showProgressPercentage: false,
  },

  spacedRepetition: {
    /** Задержка после неправильного ответа (мс) */
    incorrectAnswerDelay: 60000, // 1 минута
    /** Увеличение прогресса за правильный ответ (%) */
    progressIncrease: 10,
    /** Уменьшение прогресса за неправильный ответ (%) */
    progressDecrease: 20,
    /** Сброс счетчика успешных повторений при низком прогрессе */
    resetSuccessfulReviewsThreshold: 20,
    /** Интервалы повторений (в порядке возрастания) */
    reviewIntervals: [
      { minutes: 1 },      // 1-й успешный ответ
      { minutes: 10 },     // 2-й успешный ответ  
      { minutes: 30 },     // 3-й успешный ответ
      { hours: 1 },       // 4-й успешный ответ
      { days: 1 },         // 5-й успешный ответ
      { days: 2 }         // 6-й успешный ответ
    ],
  },

  difficulty: {
    beginner: {
      translationDelay: 2000, // Больше времени для начинающих
      cardReturnDelay: 3000, // Больше времени перед переходом к следующей карточке
      showActionButtons: true,
      requireInputForButtons: false,
    },
    intermediate: {
      translationDelay: 1500,
      cardReturnDelay: 2000, // Стандартное время
      showActionButtons: true,
      requireInputForButtons: true,
    },
    advanced: {
      translationDelay: 1000, // Меньше времени для продвинутых
      cardReturnDelay: 1000, // Быстрее переход для продвинутых
      showActionButtons: true,
      requireInputForButtons: true,
      nextCardOnEnter: true,
      enterPressesToNext: 1, // Быстрее переход для продвинутых
    }
  }
};

/**
 * Утилиты для работы с конфигурацией
 */
export class CardDisplayConfigUtils {
  /**
   * Получить режим отображения на основе прогресса и количества повторений
   */
  static getDisplayMode(progress: number, reviewCount: number = 0): string {
    const modes = CARD_DISPLAY_CONFIG.modes;
    
    // Проверяем режимы в порядке приоритета
    for (const [modeName, config] of Object.entries(modes)) {
      if (progress >= config.minProgress && progress <= config.maxProgress) {
        // Проверяем чередование
        if (config.alternatesWith && config.alternateCondition) {
          const shouldAlternate = config.alternateCondition === 'even' 
            ? reviewCount % 2 === 0 
            : reviewCount % 2 === 1;
          
          if (shouldAlternate && config.alternatesWith.length > 0) {
            return config.alternatesWith[0];
          }
        }
        
        return modeName;
      }
    }
    
    // Fallback на последний режим
    return 'LISTENING_2';
  }

  /**
   * Получить конфигурацию режима
   */
  static getModeConfig(modeName: string): CardDisplayModeConfig | null {
    return CARD_DISPLAY_CONFIG.modes[modeName] || null;
  }

  /**
   * Получить конфигурацию с учетом уровня сложности
   */
  static getModeConfigWithDifficulty(
    modeName: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): CardDisplayModeConfig | null {
    const baseConfig = this.getModeConfig(modeName);
    if (!baseConfig) return null;

    const difficultyConfig = CARD_DISPLAY_CONFIG.difficulty[difficulty];
    
    return {
      ...baseConfig,
      ...difficultyConfig,
    };
  }

  /**
   * Проверить, нужно ли показывать перевод автоматически
   */
  static shouldShowTranslationAutomatically(modeName: string): boolean {
    const config = this.getModeConfig(modeName);
    return config?.showTranslationAutomatically || false;
  }

  /**
   * Получить задержку перед показом перевода
   */
  static getTranslationDelay(modeName: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): number {
    const config = this.getModeConfigWithDifficulty(modeName, difficulty);
    return config?.translationDelay || 0;
  }

  /**
   * Получить задержку перед возвратом к показу карточки после ответа
   */
  static getCardReturnDelay(modeName: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): number {
    const config = this.getModeConfigWithDifficulty(modeName, difficulty);
    return config?.cardReturnDelay || 2000; // По умолчанию 2 секунды
  }

  /**
   * Проверить, нужно ли показывать поле ввода
   */
  static shouldShowInputField(modeName: string): boolean {
    const config = this.getModeConfig(modeName);
    return config?.showInputField || false;
  }

  /**
   * Проверить, нужно ли показывать кнопки действий
   */
  static shouldShowActionButtons(modeName: string): boolean {
    const config = this.getModeConfig(modeName);
    return config?.showActionButtons || false;
  }

  /**
   * Проверить, требуются ли кнопки ввода для активации кнопок
   */
  static requireInputForButtons(modeName: string): boolean {
    const config = this.getModeConfig(modeName);
    return config?.requireInputForButtons || false;
  }

  /**
   * Получить количество нажатий Enter для перехода к следующей карточке
   */
  static getEnterPressesToNext(modeName: string): number {
    const config = this.getModeConfig(modeName);
    return config?.enterPressesToNext || 0;
  }

  /**
   * Получить все доступные режимы
   */
  static getAllModes(): Record<string, CardDisplayModeConfig> {
    return CARD_DISPLAY_CONFIG.modes;
  }

  /**
   * Получить задержку после неправильного ответа
   */
  static getIncorrectAnswerDelay(): number {
    return CARD_DISPLAY_CONFIG.spacedRepetition.incorrectAnswerDelay;
  }

  /**
   * Получить увеличение прогресса за правильный ответ
   */
  static getProgressIncrease(): number {
    return CARD_DISPLAY_CONFIG.spacedRepetition.progressIncrease;
  }

  /**
   * Получить уменьшение прогресса за неправильный ответ
   */
  static getProgressDecrease(): number {
    return CARD_DISPLAY_CONFIG.spacedRepetition.progressDecrease;
  }

  /**
   * Получить порог для сброса счетчика успешных повторений
   */
  static getResetSuccessfulReviewsThreshold(): number {
    return CARD_DISPLAY_CONFIG.spacedRepetition.resetSuccessfulReviewsThreshold;
  }

  /**
   * Получить интервалы повторений
   */
  static getReviewIntervals(): Array<{ minutes?: number; hours?: number; days?: number; }> {
    return CARD_DISPLAY_CONFIG.spacedRepetition.reviewIntervals;
  }

  /**
   * Получить следующий интервал повторения по количеству успешных повторений
   */
  static getNextReviewInterval(successfulReviews: number): { minutes?: number; hours?: number; days?: number; } {
    const intervals = this.getReviewIntervals();
    const index = Math.min(successfulReviews - 1, intervals.length - 1);
    
    if (index < 0) {
      // Для первого показа
      return { minutes: 1 };
    }
    
    return intervals[index];
  }

  /**
   * Получить общие настройки
   */
  static getGeneralSettings() {
    return CARD_DISPLAY_CONFIG.general;
  }

  /**
   * Проверить, нужно ли показывать индикатор прогресса
   */
  static shouldShowProgressIndicator(): boolean {
    return CARD_DISPLAY_CONFIG.general.showProgressIndicator;
  }

  /**
   * Получить размер индикатора прогресса
   */
  static getProgressIndicatorSize(): number {
    return CARD_DISPLAY_CONFIG.general.progressIndicatorSize;
  }

  /**
   * Проверить, нужно ли показывать процент в индикаторе прогресса
   */
  static shouldShowProgressPercentage(): boolean {
    return CARD_DISPLAY_CONFIG.general.showProgressPercentage;
  }

  /**
   * Обновить конфигурацию (для динамических изменений)
   */
  static updateConfig(updates: Partial<CardDisplaySettings>): void {
    Object.assign(CARD_DISPLAY_CONFIG, updates);
  }

  /**
   * Сбросить конфигурацию к значениям по умолчанию
   */
  static resetConfig(): void {
    // Перезагружаем конфигурацию из файла
    window.location.reload();
  }
}

// Типы уже экспортированы выше в интерфейсах
