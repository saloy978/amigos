interface LanguagePairData {
  known_language: string;
  learning_language: string;
  known_language_code: string;
  learning_language_code: string;
}

interface UserPreferences {
  language_pair: LanguagePairData;
  daily_goal: number;
  notifications_enabled: boolean;
  sound_effects_enabled: boolean;
}

export class DatabaseService {
  private static readonly STORAGE_KEYS = {
    USER_PREFERENCES: 'user_preferences',
    CARDS: 'spaced_repetition_cards',
    USER_STATS: 'user_stats'
  };

  // Language Pair Management
  static async saveLanguagePair(languagePair: LanguagePairData): Promise<void> {
    try {
      const preferences = this.getUserPreferences();
      preferences.language_pair = languagePair;
      
      localStorage.setItem(
        this.STORAGE_KEYS.USER_PREFERENCES, 
        JSON.stringify(preferences)
      );
      
      console.log('Language pair saved to database:', languagePair);
    } catch (error) {
      console.error('Error saving language pair:', error);
      throw error;
    }
  }

  static getLanguagePair(): LanguagePairData | null {
    try {
      const preferences = this.getUserPreferences();
      return preferences.language_pair || null;
    } catch (error) {
      console.error('Error getting language pair:', error);
      return null;
    }
  }

  // User Preferences Management
  static getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default preferences
      return {
        language_pair: {
          known_language: 'Русский',
          learning_language: 'English',
          known_language_code: 'ru',
          learning_language_code: 'en'
        },
        daily_goal: 20,
        notifications_enabled: true,
        sound_effects_enabled: true
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        language_pair: {
          known_language: 'Русский',
          learning_language: 'English',
          known_language_code: 'ru',
          learning_language_code: 'en'
        },
        daily_goal: 20,
        notifications_enabled: true,
        sound_effects_enabled: true
      };
    }
  }

  static async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const currentPreferences = this.getUserPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      localStorage.setItem(
        this.STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPreferences)
      );
      
      console.log('User preferences saved:', updatedPreferences);
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // Cards Management with Language Pair Filtering
  static getCardsForLanguagePair(languagePairId: string): any[] {
    try {
      const allCards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CARDS) || '[]');
      return allCards.filter((card: any) => card.languagePairId === languagePairId);
    } catch (error) {
      console.error('Error getting cards for language pair:', error);
      return [];
    }
  }

  static async updateCardsLanguagePair(oldPairId: string, newPairId: string): Promise<void> {
    try {
      const allCards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CARDS) || '[]');
      const updatedCards = allCards.map((card: any) => {
        if (card.languagePairId === oldPairId) {
          return { ...card, languagePairId: newPairId };
        }
        return card;
      });
      
      localStorage.setItem(this.STORAGE_KEYS.CARDS, JSON.stringify(updatedCards));
      console.log('Cards language pair updated from', oldPairId, 'to', newPairId);
    } catch (error) {
      console.error('Error updating cards language pair:', error);
      throw error;
    }
  }

  // Generate language pair ID
  static generateLanguagePairId(knownCode: string, learningCode: string): string {
    return `${knownCode}-${learningCode}`;
  }

  // Validate language pair change
  static async validateLanguagePairChange(
    knownCode: string, 
    learningCode: string
  ): Promise<{ valid: boolean; message?: string }> {
    if (knownCode === learningCode) {
      return {
        valid: false,
        message: 'Язык изучения должен отличаться от известного языка'
      };
    }

    // Check if user has cards for current language pair
    const currentPair = this.getLanguagePair();
    if (currentPair) {
      const currentPairId = this.generateLanguagePairId(
        currentPair.known_language_code,
        currentPair.learning_language_code
      );
      const existingCards = this.getCardsForLanguagePair(currentPairId);
      
      if (existingCards.length > 0) {
        return {
          valid: true,
          message: `У вас есть ${existingCards.length} карточек для текущей языковой пары. Они будут обновлены для новой пары.`
        };
      }
    }

    return { valid: true };
  }
}