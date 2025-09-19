import { supabase } from './supabaseClient';

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
  name: string;
  avatar_url?: string;
  level: string;
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

  // Get user from Supabase database (now from user_settings)
  static async getCurrentUserFromDB(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('No authenticated user found');
        return null;
      }

      // Get user settings from database
      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user settings from database:', error);
        // If error, create default user from auth data
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.display_name || authUser.user_metadata?.name || authUser.user_metadata?.display_name || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || '/assets/Foto.png',
          level: authUser.user_metadata?.level || 'Beginner',
          created_at: new Date(authUser.created_at),
          updated_at: new Date(authUser.updated_at || authUser.created_at)
        };
      }

      if (!userSettings) {
        console.log('No user settings found, creating default user from auth data');
        // If no user_settings found, create default user from auth data
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.display_name || authUser.user_metadata?.name || authUser.user_metadata?.display_name || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || '/assets/Foto.png',
          level: authUser.user_metadata?.level || 'Beginner',
          created_at: new Date(authUser.created_at),
          updated_at: new Date(authUser.updated_at || authUser.created_at)
        };
      }

      if (userSettings) {
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.display_name || userSettings.name, // Use display_name from auth.users first, fallback to user_settings
          avatar_url: userSettings.avatar_url,
          level: userSettings.level,
          created_at: new Date(userSettings.created_at),
          updated_at: new Date(userSettings.updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user from database:', error);
      return null;
    }
  }

  // Get user data directly from auth.users table
  static async getCurrentUserFromAuth(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('No authenticated user found');
        return null;
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.display_name || authUser.user_metadata?.name || authUser.user_metadata?.display_name || 'User',
        avatar_url: authUser.user_metadata?.avatar_url || '/assets/Foto.png',
        level: authUser.user_metadata?.level || 'Beginner',
        created_at: new Date(authUser.created_at),
        updated_at: new Date(authUser.updated_at || authUser.created_at)
      };
    } catch (error) {
      console.error('Error getting user from auth:', error);
      return null;
    }
  }

  // Update user display_name in auth.users table
  static async updateUserDisplayNameInAuth(name: string): Promise<boolean> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.error('No authenticated user found');
        return false;
      }

      // Update display_name in auth.users table
      const { error } = await supabase
        .from('auth.users')
        .update({ display_name: name })
        .eq('id', authUser.id);

      if (error) {
        console.error('Error updating display_name in auth.users:', error);
        return false;
      }

      console.log('Display name updated in auth.users:', name);
      return true;
    } catch (error) {
      console.error('Error updating display_name in auth.users:', error);
      return false;
    }
  }

  // Create or update user in Supabase database (now in user_settings)
  static async createOrUpdateUserInDB(userData: Partial<User>): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.error('No authenticated user found');
        return null;
      }

      // Check if user settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      const userName = userData.name || existingSettings?.name || authUser.user_metadata?.name || 'User';
      
      // Update display_name in auth.users if it's provided and different
      if (userData.name && userData.name !== authUser.display_name) {
        await this.updateUserDisplayNameInAuth(userData.name);
      }

      const settingsDataToSave = {
        user_id: authUser.id,
        name: userName,
        avatar_url: userData.avatar_url || existingSettings?.avatar_url || authUser.user_metadata?.avatar_url || '/assets/Foto.png',
        level: userData.level || existingSettings?.level || 'Beginner',
        known_language: existingSettings?.known_language || 'Русский',
        learning_language: existingSettings?.learning_language || 'Español',
        known_language_code: existingSettings?.known_language_code || 'ru',
        learning_language_code: existingSettings?.learning_language_code || 'es',
        daily_goal: existingSettings?.daily_goal || 20,
        notifications_enabled: existingSettings?.notifications_enabled ?? true,
        sound_effects_enabled: existingSettings?.sound_effects_enabled ?? true,
        app_language: existingSettings?.app_language || 'ru',
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingSettings) {
        // Update existing user settings
        const { data, error } = await supabase
          .from('user_settings')
          .update(settingsDataToSave)
          .eq('user_id', authUser.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating user in database:', error);
          return null;
        }
        result = data;
      } else {
        // Create new user settings
        const { data, error } = await supabase
          .from('user_settings')
          .insert({
            ...settingsDataToSave,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user in database:', error);
          return null;
        }
        result = data;
      }

      // Update localStorage cache
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: result.name,
        avatar_url: result.avatar_url,
        level: result.level,
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      };
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Error creating/updating user in database:', error);
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
        avatar_url: userData.avatar_url || currentUser?.avatar_url || '/assets/Foto.png',
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
      // Update display_name in auth.users if provided
      if (userData.name) {
        await this.updateUserDisplayNameInAuth(userData.name);
      }

      // First try to update in Supabase database
      const dbUser = await this.createOrUpdateUserInDB(userData);
      if (dbUser) {
        console.log('User updated in database:', dbUser);
        return dbUser;
      }

      // Fallback to localStorage if database update fails
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
      console.log('User updated in localStorage:', updatedUser);
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
        name: settingsData.name || currentSettings?.name || currentUser?.name || 'User',
        avatar_url: settingsData.avatar_url || currentSettings?.avatar_url || currentUser?.avatar_url || '/assets/Foto.png',
        level: settingsData.level || currentSettings?.level || currentUser?.level || 'Beginner',
        known_language: settingsData.known_language || currentSettings?.known_language || 'Русский',
        learning_language: settingsData.learning_language || currentSettings?.learning_language || 'Español',
        known_language_code: settingsData.known_language_code || currentSettings?.known_language_code || 'ru',
        learning_language_code: settingsData.learning_language_code || currentSettings?.learning_language_code || 'es',
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
          avatar_url: '/assets/Foto.png'
        });
      }

      if (!settings) {
        settings = await this.saveUserSettings({
          user_id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          level: user.level,
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