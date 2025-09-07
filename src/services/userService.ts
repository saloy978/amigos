interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: string;
  created_at: Date;
  updated_at: Date;
}

interface UserSettings {
  id: string;
  user_id: string;
  known_language: string;
  learning_language: string;
  known_language_code: string;
  learning_language_code: string;
  daily_goal: number;
  notifications_enabled: boolean;
  sound_effects_enabled: boolean;
  app_language: string;
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  private static readonly STORAGE_KEYS = {
    USER: 'current_user',
    USER_SETTINGS: 'user_settings'
  };

  // User Management
  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USER);
      if (stored) {
        const user = JSON.parse(stored);
        return {
          ...user,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async saveUser(userData: Partial<User>): Promise<User> {
    try {
      const currentUser = this.getCurrentUser();
      const now = new Date();
      
      const user: User = {
        id: currentUser?.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email || currentUser?.email || '',
        name: userData.name || currentUser?.name || '',
        avatar_url: userData.avatar_url || currentUser?.avatar_url,
        level: userData.level || currentUser?.level || 'Beginner',
        created_at: currentUser?.created_at || now,
        updated_at: now
      };

      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      console.log('User saved:', user);
      return user;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async updateUser(userData: Partial<User>): Promise<User> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user found');
      }

      const updatedUser: User = {
        ...currentUser,
        ...userData,
        updated_at: new Date()
      };

      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      console.log('User updated:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // User Settings Management
  static getUserSettings(): UserSettings | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          ...settings,
          created_at: new Date(settings.created_at),
          updated_at: new Date(settings.updated_at)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  static async saveUserSettings(settingsData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const currentUser = this.getCurrentUser();
      const currentSettings = this.getUserSettings();
      const now = new Date();

      const settings: UserSettings = {
        id: currentSettings?.id || `settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser?.id || 'default-user',
        known_language: settingsData.known_language || currentSettings?.known_language || 'Русский',
        learning_language: settingsData.learning_language || currentSettings?.learning_language || 'English',
        known_language_code: settingsData.known_language_code || currentSettings?.known_language_code || 'ru',
        learning_language_code: settingsData.learning_language_code || currentSettings?.learning_language_code || 'en',
        daily_goal: settingsData.daily_goal || currentSettings?.daily_goal || 20,
        notifications_enabled: settingsData.notifications_enabled ?? currentSettings?.notifications_enabled ?? true,
        sound_effects_enabled: settingsData.sound_effects_enabled ?? currentSettings?.sound_effects_enabled ?? true,
        app_language: settingsData.app_language || currentSettings?.app_language || 'ru',
        created_at: currentSettings?.created_at || now,
        updated_at: now
      };

      localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
      console.log('User settings saved:', settings);
      return settings;
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  static async updateUserSettings(settingsData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const currentSettings = this.getUserSettings();
      if (!currentSettings) {
        return this.saveUserSettings(settingsData);
      }

      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...settingsData,
        updated_at: new Date()
      };

      localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
      console.log('User settings updated:', updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Initialize default user and settings
  static async initializeDefaultUser(): Promise<{ user: User; settings: UserSettings }> {
    try {
      let user = this.getCurrentUser();
      let settings = this.getUserSettings();

      if (!user) {
        user = await this.saveUser({
          email: 'anna@example.com',
          name: 'Anna',
          level: 'Intermediate',
          avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop&crop=face'
        });
      }

      if (!settings) {
        settings = await this.saveUserSettings({
          user_id: user.id,
          known_language: 'Русский',
          learning_language: 'Español',
          known_language_code: 'ru',
          learning_language_code: 'es',
          daily_goal: 20
        });
      }

      return { user, settings };
    } catch (error) {
      console.error('Error initializing default user:', error);
      throw error;
    }
  }

  // Clear user data (for logout)
  static clearUserData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.USER);
      localStorage.removeItem(this.STORAGE_KEYS.USER_SETTINGS);
      console.log('User data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
}