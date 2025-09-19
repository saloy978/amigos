import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Mail, 
  Key, 
  Globe, 
  Languages, 
  Target, 
  Bell, 
  Volume2, 
  BarChart3, 
  Clock, 
  Info,
  LogOut,
  QrCode,
  Edit,
  BookOpen
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { LanguageSelectionModal } from '../modals/LanguageSelectionModal';
import { EditProfileModal } from '../modals/EditProfileModal';
import { DatabaseService } from '../../services/database';
import { UserService } from '../../services/userService';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: string;
  created_at: Date;
  updated_at: Date;
}

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const LEVELS = [
  { value: 'Beginner', label: 'Beginner • A1' },
  { value: 'Elementary', label: 'Elementary • A2' },
  { value: 'Intermediate', label: 'Intermediate • B1' },
  { value: 'Upper-Intermediate', label: 'Upper-Intermediate • B2' },
  { value: 'Advanced', label: 'Advanced • C1' },
  { value: 'Proficient', label: 'Proficient • C2' }
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  const { state } = useAppContext();
  const [dailyGoal, setDailyGoal] = useState(20);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentLanguagePair, setCurrentLanguagePair] = useState(() => {
    const settings = UserService.getUserSettings();
    const pair = settings || DatabaseService.getLanguagePair();
    return pair ? {
      known: { code: pair.known_language_code, name: pair.known_language, flag: getLanguageFlag(pair.known_language_code) },
      learning: { code: pair.learning_language_code, name: pair.learning_language, flag: getLanguageFlag(pair.learning_language_code) }
    } : {
      known: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      learning: { code: 'es', name: 'Español', flag: '🇪🇸' }
    };
  });
  
  // Load user data from Supabase when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoadingUser(true);
        
        // First try to get user directly from auth.users
        let user = await UserService.getCurrentUserFromAuth();
        
        // If no user from auth, try to get from database with settings
        if (!user) {
          user = await UserService.getCurrentUserFromDB();
        }
        
        // If still no user, try localStorage as fallback
        if (!user) {
          user = UserService.getCurrentUser();
        }
        
        // If still no user, create one from auth data
        if (!user) {
          user = await UserService.createOrUpdateUserInDB({});
        }
        
        if (user) {
          console.log('Loaded user data:', { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            display_name: user.name 
          });
          setCurrentUser(user);
        }
        
        // Load language settings
        const settings = UserService.getUserSettings();
        if (settings) {
          const pair = {
            known: { code: settings.known_language_code, name: settings.known_language, flag: getLanguageFlag(settings.known_language_code) },
            learning: { code: settings.learning_language_code, name: settings.learning_language, flag: getLanguageFlag(settings.learning_language_code) }
          };
          setCurrentLanguagePair(pair);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage
        const user = UserService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    loadUserData();
  }, []);

  const totalWords = state.cards.length;
  const averageProgress = totalWords > 0 
    ? Math.round(state.cards.reduce((sum, card) => sum + card.progress, 0) / totalWords)
    : 0;

  function getLanguageFlag(code: string): string {
    const flags: Record<string, string> = {
      'ru': '🇷🇺', 'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
      'it': '🇮🇹', 'pt': '🇵🇹', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷'
    };
    return flags[code] || '🌐';
  }

  const handleLanguagePairSave = async (knownLanguage: any, learningLanguage: any, level: string) => {
    try {
      const newSettings = {
        known_language: knownLanguage.name,
        learning_language: learningLanguage.name,
        known_language_code: knownLanguage.code,
        learning_language_code: learningLanguage.code
      };

      // Update user level as well
      await UserService.updateUser({ level });
      setCurrentUser((prev: User | null) => prev ? ({ ...prev, level }) : null);

      // Validate the change
      const validation = await DatabaseService.validateLanguagePairChange(
        knownLanguage.code,
        learningLanguage.code
      );

      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      // Save to user settings
      await UserService.updateUserSettings(newSettings);

      // Update local state
      setCurrentLanguagePair({
        known: knownLanguage,
        learning: learningLanguage
      });

      // Update existing cards if needed
      const oldPairId = DatabaseService.generateLanguagePairId(
        currentLanguagePair.known.code,
        currentLanguagePair.learning.code
      );
      const newPairId = DatabaseService.generateLanguagePairId(
        knownLanguage.code,
        learningLanguage.code
      );

      if (oldPairId !== newPairId) {
        await DatabaseService.updateCardsLanguagePair(oldPairId, newPairId);
      }

      if (validation.message) {
        alert(validation.message);
      }

    } catch (error) {
      console.error('Error saving language pair:', error);
      alert('Ошибка при сохранении языковой пары');
    }
  };

  const handleProfileSave = async (userData: { name: string; email: string; avatar_url?: string }) => {
    try {
      // Update display_name in auth.users if name changed
      if (userData.name && userData.name !== currentUser?.name) {
        await UserService.updateUserDisplayNameInAuth(userData.name);
      }
      
      const updatedUser = await UserService.updateUser(userData);
      setCurrentUser(updatedUser);
      
      console.log('Profile saved successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Ошибка при сохранении профиля');
    }
  };

  const handleDailyGoalChange = (value: number) => {
    setDailyGoal(value);
    UserService.updateUserSettings({ daily_goal: value });
  };

  const handleLevelChange = async (level: string) => {
    try {
      await UserService.updateUser({ level });
      setCurrentUser((prev: User | null) => prev ? ({ ...prev, level }) : null);
      
      // Refresh user data to ensure consistency
      const refreshedUser = await UserService.getCurrentUserFromAuth();
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      }
    } catch (error) {
      console.error('Error updating level:', error);
      alert('Ошибка при обновлении уровня языка');
    }
  };

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    rightContent?: React.ReactNode;
    onClick?: () => void;
  }> = ({ icon, title, subtitle, rightContent, onClick }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-0 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="text-blue-600">
          {icon}
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">{title}</h2>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <img src="/assets/Back.png" alt="Back" className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-gray-900">Профиль</h1>
            <div className="w-12" />
          </div>
        </div>

        <div className="p-4">
          {/* Profile Header */}
          {isLoadingUser ? (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ) : currentUser ? (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {currentUser.avatar_url ? (
                      <img 
                        src={currentUser.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600">{currentUser?.level || 'Beginner'}</p>
                </div>
              </div>
              <QrCode className="w-8 h-8 text-gray-400" />
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${averageProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-900">{averageProgress}%</span>
              <span className="text-gray-600">Streak: {state.userStats.streak} days</span>
              <span className="text-gray-600">Teach: {totalWords} words</span>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          )}

          {/* Account Section */}
          <SectionHeader title="Account" />
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <MenuItem
              icon={<Mail className="w-5 h-5" />}
              title="Email"
              subtitle={currentUser?.email || 'Не указан'}
              onClick={() => console.log('Email settings')}
            />
            <MenuItem
              icon={<Key className="w-5 h-5" />}
              title="Change password"
              onClick={() => console.log('Change password')}
            />
            <MenuItem
              icon={<BookOpen className="w-5 h-5" />}
              title="Уровень языка"
              rightContent={
                <select
                  value={currentUser?.level || 'Beginner'}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="text-sm text-gray-500 bg-transparent border-none outline-none cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              }
              onClick={() => {}} // Disable click to prevent menu item action
            />
            <MenuItem
              icon={<Globe className="w-5 h-5" />}
              title="App language"
              onClick={() => console.log('App language')}
            />
            <MenuItem
              icon={<LogOut className="w-5 h-5" />}
              title="Log out"
              onClick={onLogout}
            />
          </div>

          {/* Learning Section */}
          <SectionHeader title="Learning" />
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <MenuItem
              icon={<Languages className="w-5 h-5" />}
              title="Content language pair"
              rightContent={
                <span className="text-sm text-gray-500">
                  {currentLanguagePair.known.flag} {currentLanguagePair.known.code.toUpperCase()} → {currentLanguagePair.learning.flag} {currentLanguagePair.learning.code.toUpperCase()}
                </span>
              }
              onClick={() => setIsLanguageModalOpen(true)}
            />
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="text-blue-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Daily goal</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{dailyGoal} words/day</span>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={dailyGoal}
                    onChange={(e) => handleDailyGoalChange(Number(e.target.value))}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
            <MenuItem
              icon={<Bell className="w-5 h-5" />}
              title="Notifications"
              onClick={() => console.log('Notifications')}
            />
            <MenuItem
              icon={<Volume2 className="w-5 h-5" />}
              title="Sound effects"
              onClick={() => console.log('Sound effects')}
            />
          </div>

          {/* Progress Section */}
          <SectionHeader title="Progress" />
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <MenuItem
              icon={<BarChart3 className="w-5 h-5" />}
              title="Statistics"
              onClick={() => console.log('Statistics')}
            />
            <MenuItem
              icon={<Clock className="w-5 h-5" />}
              title="Sessions"
              rightContent={<span className="text-sm text-gray-500">System</span>}
              onClick={() => console.log('Sessions')}
            />
            <MenuItem
              icon={<Info className="w-5 h-5" />}
              title="About"
              onClick={() => console.log('About')}
            />
          </div>

        </div>

        {/* Language Selection Modal */}
        <LanguageSelectionModal
          isOpen={isLanguageModalOpen}
          onClose={() => setIsLanguageModalOpen(false)}
          onSave={handleLanguagePairSave}
          currentKnownLanguage={currentLanguagePair.known}
          currentLearningLanguage={currentLanguagePair.learning}
          currentLevel={currentUser?.level || 'Beginner'}
        />

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSave={handleProfileSave}
          currentUser={currentUser || { id: '', email: '', name: '', level: 'Beginner', created_at: new Date(), updated_at: new Date() }}
        />
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};