import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { RegistrationScreen } from './components/auth/RegistrationScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { SessionScreen } from './components/session/SessionScreen';
import { StatsScreen } from './components/stats/StatsScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { CardManagerScreen } from './components/cards/CardManagerScreen';
import { LessonsScreen } from './components/lessons/LessonsScreen';
import { LessonScreen } from './components/lessons/LessonScreen';
import { Lesson1Screen } from './components/lessons/Lesson1Screen';
import { LessonAlphabetScreen } from './components/lessons/LessonAlphabetScreen';
import { SoundHuntPage } from './pages/SoundHuntPage';
import { NumbersHuntPage } from './pages/NumbersHuntPage';
import { ArticulosRoulettePage } from './pages/ArticulosRoulettePage';
import { Header } from './components/layout/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
// import { sampleLanguagePair, sampleCards } from './utils/sampleData'; // Removed - using Supabase data
import { DatabaseService } from './services/database';
import { UserService } from './services/userService';
import { Card } from './types';
import { LoginScreen } from './components/auth/LoginScreen';
import { EmailVerificationScreen } from './components/auth/EmailVerificationScreen';
import { CardService } from './services/cardService';
import { supabase } from './services/supabaseClient';
import { logInfo, logWarn, logError, logDebug } from './utils/browserLogger';

type Screen = 'login' | 'registration' | 'email-verification' | 'home' | 'session' | 'stats' | 'profile' | 'cards' | 'lessons' | 'lesson' | 'lesson1' | 'lesson-alphabet' | 'sound-hunt' | 'numbers-hunt' | 'articulos-roulette';

function AppContent() {
  const { state, dispatch } = useAppContext();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [previousScreen, setPreviousScreen] = useState<Screen>('login');
  const [cardsFilter, setCardsFilter] = useState<'all' | 'learn' | 'review' | 'suspended'>('all');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already authenticated on app load
    return false; // Will be set properly after checking Supabase session
  });
  
  // Persist data to localStorage
  const [storedCards, setStoredCards] = useLocalStorage('spaced-repetition-cards', []);
  const [storedLanguagePair, setStoredLanguagePair] = useLocalStorage('current-language-pair', {
    id: 'ru-es',
    knownLanguage: 'Русский',
    learningLanguage: 'Español',
    knownLanguageCode: 'ru',
    learningLanguageCode: 'es'
  });
  const [storedUserStats, setStoredUserStats] = useLocalStorage('user-stats', {
    streak: 5,
    totalCards: 0,
    learnedCards: 0,
    masteredCards: 0,
    reviewsDue: 0,
    lastSessionDate: new Date()
  });

  // Initialize app data from localStorage
  useEffect(() => {
    // Check authentication session
    const checkAuthSession = async () => {
      try {
        // Check if Supabase is configured
        if (!supabase) {
          console.log('⚠️ Supabase not configured, skipping authentication check');
          setIsAuthenticated(false);
          setCurrentScreen('login');
          return;
        }
        
        // Check Supabase authentication session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          
          // Handle specific auth errors
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found')) {
            console.log('🔄 Refresh token invalid, clearing session');
            await supabase.auth.signOut();
          }
          
          setIsAuthenticated(false);
          setCurrentScreen('login');
          return;
        }
        
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentScreen('home');
          console.log('Auto-login successful for:', session.user.email || 'Anonymous user');
          
          // Load cards from database when authenticated
          await loadCardsFromDatabase();
        } else {
          // No valid session, try to sign in anonymously
          console.log('🔄 No session found, attempting anonymous sign-in...');
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Error signing in anonymously:', error);
            setIsAuthenticated(false);
            setCurrentScreen('login');
          } else {
            console.log('✅ Anonymous sign-in successful:', data.user.id);
            setIsAuthenticated(true);
            setCurrentScreen('home');
            // Load cards from database after authentication
            await loadCardsFromDatabase();
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear any stale session data on error
        if (supabase) {
          await supabase.auth.signOut();
        }
        setIsAuthenticated(false);
        setCurrentScreen('login');
      }
    };
    
    checkAuthSession();

    // Initialize user data
    UserService.initializeDefaultUser().catch(console.error);

    // Load cards (will use sample cards if not authenticated)
    loadCardsFromDatabase();

    // Initialize language pair from database
    const userSettings = UserService.getUserSettings();
    const languagePair = userSettings || DatabaseService.getLanguagePair();
    if (languagePair) {
      const pair = {
        id: DatabaseService.generateLanguagePairId(
          languagePair.known_language_code,
          languagePair.learning_language_code
        ),
        knownLanguage: languagePair.known_language,
        learningLanguage: languagePair.learning_language,
        knownLanguageCode: languagePair.known_language_code,
        learningLanguageCode: languagePair.learning_language_code
      };
      dispatch({ type: 'SET_CURRENT_LANGUAGE_PAIR', payload: pair });
    } else {
      dispatch({ type: 'SET_CURRENT_LANGUAGE_PAIR', payload: storedLanguagePair });
    }

    // Convert date string back to Date object for user stats
    const userStatsWithDate = {
      ...storedUserStats,
      lastSessionDate: new Date(storedUserStats.lastSessionDate)
    };
    
    dispatch({ type: 'UPDATE_USER_STATS', payload: userStatsWithDate });
  }, []);


  // Load cards from database
  const loadCardsFromDatabase = async () => {
        logInfo('🔄 loadCardsFromDatabase: Starting...', null, 'App');
    try {
      // Check if Supabase is configured
      if (!supabase) {
        logWarn('⚠️ Supabase not configured, using empty cards', null, 'App');
        dispatch({ type: 'SET_CARDS', payload: [] });
        return;
      }
      logInfo('✅ loadCardsFromDatabase: Supabase configured', null, 'App');
      
      // Check if user is authenticated before loading cards
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        logWarn('❌ loadCardsFromDatabase: User not authenticated, using empty cards', null, 'App');
        // Use empty cards as fallback for unauthenticated users
        dispatch({ type: 'SET_CARDS', payload: [] });
        return;
      }
      logInfo('✅ loadCardsFromDatabase: User authenticated:', session.user.id, 'App');
      
      // Load existing cards (no automatic starter cards creation)
      logInfo('🔄 loadCardsFromDatabase: Calling CardService.getUserCards...', null, 'App');
      const cards = await CardService.getUserCards();
      logInfo(`📚 loadCardsFromDatabase: Loaded ${cards.length} existing cards for user`, null, 'App');
      dispatch({ type: 'SET_CARDS', payload: cards });
    } catch (error) {
      console.error('Error loading cards from database:', error);
      // On error, use empty cards as fallback
      console.log('Using empty cards as fallback');
      dispatch({ type: 'SET_CARDS', payload: [] });
    }
  };

  // Save to localStorage when state changes
  useEffect(() => {
    if (state.cards.length > 0) {
      setStoredCards(state.cards);
    }
  }, [state.cards, setStoredCards]);

  useEffect(() => {
    if (state.currentLanguagePair) {
      setStoredLanguagePair(state.currentLanguagePair);
    }
  }, [state.currentLanguagePair, setStoredLanguagePair]);

  useEffect(() => {
    setStoredUserStats(state.userStats);
  }, [state.userStats, setStoredUserStats]);

  const handleEmailVerificationComplete = async (userData?: { name: string; email: string; password: string }) => {
    try {
      // Verify that user is actually confirmed
      if (!supabase) {
        alert('Supabase не настроен. Приложение работает в режиме демо.');
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user || !user.email_confirmed_at) {
        console.error('User not confirmed or error getting user:', userError);
        alert('Email еще не подтвержден. Проверьте почту и перейдите по ссылке.');
        return;
      }
      
      // Get language settings from localStorage if available
      const tempLanguageSettings = localStorage.getItem('temp_language_settings');
      let languageSettings = null;
      if (tempLanguageSettings) {
        languageSettings = JSON.parse(tempLanguageSettings);
        localStorage.removeItem('temp_language_settings'); // Clean up
      }
      
      // Update display_name in auth.users table
      if (userData?.name) {
        await UserService.updateUserDisplayNameInAuth(userData.name);
      }
      
      // Save user data to database
      await UserService.saveUser({
        email: userData?.email || user.email,
        name: userData?.name || user.user_metadata?.name || user.user_metadata?.display_name || 'Пользователь',
        level: languageSettings?.level || user.user_metadata?.level || 'Beginner'
      });
      
      // Initialize user settings with language preferences from registration
      await UserService.saveUserSettings({
        known_language: languageSettings?.knownLanguage?.name || user.user_metadata?.known_language || 'Русский',
        learning_language: languageSettings?.learningLanguage?.name || user.user_metadata?.learning_language || 'Español',
        known_language_code: languageSettings?.knownLanguage?.code || user.user_metadata?.known_language_code || 'ru',
        learning_language_code: languageSettings?.learningLanguage?.code || user.user_metadata?.learning_language_code || 'es',
        daily_goal: 20,
        notifications_enabled: true,
        sound_effects_enabled: true,
        app_language: 'ru'
      });
      
      console.log('User email verified and setup completed:', userData);
      setIsAuthenticated(true);
      setCurrentScreen('home');
      setPendingEmail('');
      
      // Load cards from database after verification (will create starter cards if needed)
      await loadCardsFromDatabase();
    } catch (error) {
      console.error('Error completing email verification:', error);
      alert('Ошибка при завершении регистрации. Попробуйте войти в систему.');
    }
  };

  const handleRegister = async (userData: { 
    name: string; 
    email: string; 
    password: string;
    knownLanguage: any;
    learningLanguage: any;
    level: string;
  }) => {
    try {
      if (!supabase) {
        alert('Supabase не настроен. Приложение работает в режиме демо.');
        return;
      }
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            display_name: userData.name,
            known_language: userData.knownLanguage.name,
            learning_language: userData.learningLanguage.name,
            known_language_code: userData.knownLanguage.code,
            learning_language_code: userData.learningLanguage.code,
            level: userData.level
          }
        }
      });
      
      if (error) {
        console.error('Supabase registration error:', error);
        alert('Ошибка при регистрации: ' + error.message);
        return;
      }
      
      if (data.user) {
        // Store language settings temporarily for after email verification
        localStorage.setItem('temp_language_settings', JSON.stringify({
          knownLanguage: userData.knownLanguage,
          learningLanguage: userData.learningLanguage,
          level: userData.level
        }));
        
        // Check if email is confirmed
        if (data.user.email_confirmed_at) {
          // Email already confirmed, proceed with login
          await handleEmailVerificationComplete(userData);
        } else {
          // Email needs verification
          setPendingEmail(userData.email);
          setCurrentScreen('email-verification');
          console.log('User registered, email verification required:', userData.email);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка при регистрации. Попробуйте еще раз.');
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      if (!supabase) {
        alert('Supabase не настроен. Приложение работает в режиме демо.');
        return;
      }
      
      // Use Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        alert('Ошибка входа: ' + error.message);
        return;
      }
      
      if (data.user) {
        console.log('User login successful:', credentials);
        setIsAuthenticated(true);
        setCurrentScreen('home');
        
        // Load cards from database after login
        await loadCardsFromDatabase();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Неверный email или пароль');
    }
  };

  const handleSwitchToRegister = () => {
    setCurrentScreen('registration');
  };

  const handleSwitchToLogin = () => {
    setCurrentScreen('login');
  };

  const handleBackToLoginFromVerification = () => {
    setPendingEmail('');
    setCurrentScreen('login');
  };

  const handleRedirectToLoginAfterVerification = () => {
    setPendingEmail('');
    setCurrentScreen('login');
  };

  const handleEmailVerificationCompleteFromScreen = async () => {
    try {
      if (!supabase || !pendingEmail) return;
      
      // Try to get current user (this works even without active session)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user for verification:', userError);
        alert('Ошибка при проверке статуса. Попробуйте войти в систему.');
        return;
      }
      
      if (user && user.email_confirmed_at) {
        // Get user metadata (name should be stored there from registration)
        const name = user.user_metadata?.name || user.user_metadata?.display_name || 'Пользователь';
        
        console.log('Email verification completed for user:', user.email, 'Name:', name);
        
        await handleEmailVerificationComplete({
          email: pendingEmail,
          name: name,
          password: '' // Not needed for verification completion
        });
      } else {
        console.log('User not found or email not confirmed. User:', user?.email, 'Confirmed at:', user?.email_confirmed_at);
        alert('Email еще не подтвержден. Проверьте почту и перейдите по ссылке.');
      }
    } catch (error) {
      console.error('Error completing email verification:', error);
      alert('Ошибка при завершении верификации. Попробуйте войти в систему.');
    }
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        // Sign out from Supabase Auth
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Logout error:', error);
        }
      }
      
      UserService.clearUserData();
      setIsAuthenticated(false);
      navigateTo('login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      navigateTo('login');
    }
  };

  const navigateTo = (screen: Screen) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  const handleStartSession = () => {
    dispatch({ type: 'START_SESSION' });
    navigateTo('session');
  };

  const handleEndSession = () => {
    dispatch({ type: 'END_SESSION' });
    navigateTo('home');
  };

  const handleProfileClick = () => {
    navigateTo('profile');
  };

  const handleNavigateBack = () => {
    navigateTo(previousScreen);
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'login':
        return 'Вход';
      case 'registration':
        return 'Регистрация';
      case 'email-verification':
        return 'Подтверждение email';
      case 'home':
        return 'SpaceRep';
      case 'session':
        return 'Повторение';
      case 'stats':
        return 'Статистика';
      case 'profile':
        return 'Профиль';
      case 'cards':
        return 'Карточки';
      case 'lessons':
        return 'Уроки';
      case 'lesson':
        return 'Урок';
      case 'lesson1':
        return 'Урок 1';
      case 'lesson-alphabet':
        return 'Испанский алфавит';
      case 'sound-hunt':
        return 'Менеджер игр';
      case 'numbers-hunt':
        return 'Звуковая охота: Числа';
      case 'articulos-roulette':
        return 'Artículos Roulette';
      default:
        return 'SpaceRep';
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToRegister={handleSwitchToRegister}
          />
        );
      case 'registration':
        return (
          <RegistrationScreen
            onRegister={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
          />
        );
      case 'email-verification':
        return (
          <EmailVerificationScreen
            email={pendingEmail}
            onBackToLogin={handleBackToLoginFromVerification}
            onVerificationComplete={handleEmailVerificationCompleteFromScreen}
            onRedirectToLogin={handleRedirectToLoginAfterVerification}
          />
        );
      case 'session':
        return <SessionScreen onEndSession={handleEndSession} onProfileClick={handleProfileClick} />;
      case 'stats':
        return <StatsScreen onBack={() => navigateTo('home')} />;
      case 'profile':
        return (
          <ProfileScreen 
            onBack={() => navigateTo('home')} 
            onLogout={handleLogout}
          />
        );
      case 'cards':
        return <CardManagerScreen onBack={() => navigateTo('home')} initialFilter={cardsFilter} />;
      case 'lessons':
        return (
          <LessonsScreen 
            onBack={() => navigateTo('home')} 
            onStartLesson={(lessonId) => {
              setCurrentLessonId(lessonId);
              if (lessonId === 'lesson-1-nouns-gender-number') {
                navigateTo('lesson1');
              } else if (lessonId === 'lesson-alphabet') {
                navigateTo('lesson-alphabet');
              } else {
                navigateTo('lesson');
              }
            }}
            onUpdateLessonProgress={(lessonId, progress) => {
              console.log(`📊 Lesson ${lessonId} progress updated to ${progress}%`);
            }}
          />
        );
      case 'lesson':
        return (
          <LessonScreen 
            lessonId={currentLessonId}
            onBack={() => navigateTo('lessons')} 
            onUpdateProgress={(progress) => {
              console.log(`📊 Lesson progress updated to ${progress}%`);
              // Здесь можно добавить логику для обновления прогресса в базе данных
            }}
            onStartLearning={() => {
              console.log('🎯 Starting learning session from lesson');
              navigateTo('session');
            }}
          />
        );
      case 'lesson1':
        return (
          <Lesson1Screen 
            lessonId={currentLessonId}
            onBack={() => navigateTo('lessons')} 
            onUpdateProgress={(progress) => {
              console.log(`📊 Lesson progress updated to ${progress}%`);
              // Здесь можно добавить логику для обновления прогресса в базе данных
            }}
          />
        );
      case 'lesson-alphabet':
        return (
          <LessonAlphabetScreen
            lessonId={currentLessonId}
            onBack={() => navigateTo('lessons')}
            onUpdateProgress={(progress) => {
              console.log(`📊 Alphabet lesson progress updated to ${progress}%`);
            }}
          />
        );
      case 'sound-hunt':
        return <SoundHuntPage 
          onNavigateToHome={() => navigateTo('home')} 
          onNavigateToNumbersHunt={() => navigateTo('numbers-hunt')}
          onNavigateToArticulosRoulette={() => navigateTo('articulos-roulette')}
        />;
      case 'numbers-hunt':
        return <NumbersHuntPage onNavigateBack={handleNavigateBack} />;
      case 'articulos-roulette':
        return <ArticulosRoulettePage onNavigateBack={handleNavigateBack} />;
      default:
        return (
          <HomeScreen
            onStartSession={handleStartSession}
            onManageCards={() => navigateTo('cards')}
            onViewStats={() => navigateTo('stats')}
            onProfileClick={handleProfileClick}
            onNavigateToCards={(filter) => {
              setCardsFilter(filter);
              navigateTo('cards');
            }}
            onNavigateToLessons={() => navigateTo('lessons')}
            onNavigateToSoundHunt={() => navigateTo('sound-hunt')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentScreen()}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;