/**
 * Режимы показа карточек (DisplayMode)
 * 
 * Конфигурация режимов теперь находится в src/config/cardDisplayConfig.ts
 * 
 * Основные режимы:
 * 1. DEMONSTRATION (0-19%) - автоматический показ перевода
 * 2. WORD (20-49%) - показ слова, перевод по тапу
 * 3. TRANSLATION (50-69%) - показ перевода, слово по тапу
 * 4. TRANSLATION_TO_WORD (≥50%) - ввод изучаемого слова при показе перевода
 * 
 * Чередование режимов настраивается в конфигурации.
 */

import { CardDisplayConfigUtils } from '../../config/cardDisplayConfig';

/**
 * Утилиты для работы с режимами отображения карточек
 */
export class CardDisplayModes {
  /**
   * Получить режим отображения на основе прогресса и количества повторений
   */
  static getDisplayMode(progress: number, reviewCount: number = 0): string {
    return CardDisplayConfigUtils.getDisplayMode(progress, reviewCount);
  }

  /**
   * Получить конфигурацию режима
   */
  static getModeConfig(modeName: string) {
    return CardDisplayConfigUtils.getModeConfig(modeName);
  }

  /**
   * Получить конфигурацию с учетом уровня сложности
   */
  static getModeConfigWithDifficulty(
    modeName: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) {
    return CardDisplayConfigUtils.getModeConfigWithDifficulty(modeName, difficulty);
  }

  /**
   * Проверить, нужно ли показывать перевод автоматически
   */
  static shouldShowTranslationAutomatically(modeName: string): boolean {
    return CardDisplayConfigUtils.shouldShowTranslationAutomatically(modeName);
  }

  /**
   * Получить задержку перед показом перевода
   */
  static getTranslationDelay(modeName: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): number {
    return CardDisplayConfigUtils.getTranslationDelay(modeName, difficulty);
  }

  /**
   * Получить задержку перед возвратом к показу карточки после ответа
   */
  static getCardReturnDelay(modeName: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): number {
    return CardDisplayConfigUtils.getCardReturnDelay(modeName, difficulty);
  }

  /**
   * Проверить, нужно ли показывать поле ввода
   */
  static shouldShowInputField(modeName: string): boolean {
    return CardDisplayConfigUtils.shouldShowInputField(modeName);
  }

  /**
   * Проверить, нужно ли показывать кнопки действий
   */
  static shouldShowActionButtons(modeName: string): boolean {
    return CardDisplayConfigUtils.shouldShowActionButtons(modeName);
  }

  /**
   * Проверить, требуются ли кнопки ввода для активации кнопок
   */
  static requireInputForButtons(modeName: string): boolean {
    return CardDisplayConfigUtils.requireInputForButtons(modeName);
  }

  /**
   * Получить количество нажатий Enter для перехода к следующей карточке
   */
  static getEnterPressesToNext(modeName: string): number {
    return CardDisplayConfigUtils.getEnterPressesToNext(modeName);
  }

  /**
   * Получить все доступные режимы
   */
  static getAllModes() {
    return CardDisplayConfigUtils.getAllModes();
  }

  /**
   * Получить общие настройки
   */
  static getGeneralSettings() {
    return CardDisplayConfigUtils.getGeneralSettings();
  }

  /**
   * Обновить конфигурацию
   */
  static updateConfig(updates: any): void {
    CardDisplayConfigUtils.updateConfig(updates);
  }

  /**
   * Сбросить конфигурацию к значениям по умолчанию
   */
  static resetConfig(): void {
    CardDisplayConfigUtils.resetConfig();
  }
}

/**
 * Экспорт для обратной совместимости
 */
export { CardDisplayConfigUtils };