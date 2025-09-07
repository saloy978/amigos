import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { RegistrationScreen } from './components/auth/RegistrationScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { SessionScreen } from './components/session/SessionScreen';
import { StatsScreen } from './components/stats/StatsScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { CardManagerScreen } from './components/cards/CardManagerScreen';
import { Header } from './components/layout/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import { sampleLanguagePair, sampleCards } from './utils/sampleData';
import { DatabaseService } from './services/database';
import { UserService } from './services/userService';
import { LoginScreen } from './components/auth/LoginScreen';
import { CardService } from './services/cardService';
import { supabase } from './services/cardService';

type Screen = 'login' | 'registration' | 'home' | 'session' | 'stats' | 'profile' | 'cards';

function AppContent() {
  const { state, dispatch } = useAppContext();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already authenticated on app load
    return false; // Will be set properly after checking Supabase session
  });
  
  // Persist data to localStorage
  const [storedCards, setStoredCards] = useLocalStorage('spaced-repetition-cards', sampleCards);
  const [storedLanguagePair, setStoredLanguagePair] = useLocalStorage('current-language-pair', sampleLanguagePair);
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
    // Check Supabase authentication session
    const checkAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth session:', error);
          // Clear any stale session data
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setCurrentScreen('login');
          return;
        }
        
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentScreen('home');
          console.log('Auto-login successful for:', session.user.email);
          
          // Load cards from database when authenticated
          await loadCardsFromDatabase();
        } else {
          // No valid session, ensure we're signed out
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setCurrentScreen('login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear any stale session data on error
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setCurrentScreen('login');
      }
    };
    
    checkAuthSession();

    // Initialize user data
    UserService.initializeDefaultUser().catch(console.error);

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
    try {
      // Check if user is authenticated before loading cards
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('User not authenticated, skipping card loading');
        return;
      }
      
      const cards = await CardService.getUserCards();
      if (cards.length > 0) {
        dispatch({ type: 'SET_CARDS', payload: cards });
      } else {
        // If no cards in database, create sample cards in Supabase
        console.log('No cards found, creating sample cards in database...');
        const createdCards = [];
        
        for (const sampleCard of sampleCards) {
          try {
            const cardData = {
              term: sampleCard.term,
              translation: sampleCard.translation,
              imageUrl: sampleCard.imageUrl,
              progress: sampleCard.progress,
              state: sampleCard.state,
              dueAt: new Date(sampleCard.dueAt),
              reviewCount: sampleCard.reviewCount,
              successfulReviews: sampleCard.successfulReviews,
              direction: sampleCard.direction,
              languagePairId: sampleCard.languagePairId,
              easeFactor: sampleCard.easeFactor,
              intervalDays: sampleCard.intervalDays,
              lastReviewedAt: sampleCard.lastReviewedAt ? new Date(sampleCard.lastReviewedAt) : undefined
            };
            
            const createdCard = await CardService.createCard(cardData);
            createdCards.push(createdCard);
          } catch (error) {
            console.error('Error creating sample card:', error);
          }
        }
        
        if (createdCards.length > 0) {
          dispatch({ type: 'SET_CARDS', payload: createdCards });
        }
      }
    } catch (error) {
      console.error('Error loading cards from database:', error);
      // On error, don't load any cards to avoid UUID conflicts
      console.error('Failed to load cards from database');
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

  const handleRegister = async (userData: { name: string; email: string; password: string }) => {
    try {
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (error) {
        console.error('Supabase registration error:', error);
        alert('Ошибка при регистрации: ' + error.message);
        return;
      }
      
      if (data.user) {
        // Save user data to database
        await UserService.saveUser({
          email: userData.email,
          name: userData.name,
          level: 'Beginner'
        });
        
        // Initialize default user settings
        await UserService.saveUserSettings({
          known_language: 'Русский',
          learning_language: 'English',
          known_language_code: 'ru',
          learning_language_code: 'en',
          daily_goal: 20,
          notifications_enabled: true,
          sound_effects_enabled: true,
          app_language: 'ru'
        });
        
        console.log('User registered successfully:', userData);
        setIsAuthenticated(true);
        setCurrentScreen('home');
        
        // Load cards from database after registration
        await loadCardsFromDatabase();
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка при регистрации. Попробуйте еще раз.');
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      // Sign in with Supabase Auth
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

  const handleLogout = async () => {
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      UserService.clearUserData();
      setIsAuthenticated(false);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      setCurrentScreen('login');
    }
  };

  const handleStartSession = () => {
    dispatch({ type: 'START_SESSION' });
    setCurrentScreen('session');
  };

  const handleEndSession = () => {
    dispatch({ type: 'END_SESSION' });
    setCurrentScreen('home');
  };

  const handleProfileClick = () => {
    setCurrentScreen('profile');
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'login':
        return 'Вход';
      case 'registration':
        return 'Регистрация';
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
      case 'session':
        return <SessionScreen onEndSession={handleEndSession} onProfileClick={handleProfileClick} />;
      case 'stats':
        return <StatsScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return (
          <ProfileScreen 
            onBack={() => setCurrentScreen('home')} 
            onLogout={handleLogout}
          />
        );
      case 'cards':
        return <CardManagerScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return (
          <HomeScreen
            onStartSession={handleStartSession}
            onManageCards={() => setCurrentScreen('cards')}
            onViewStats={() => setCurrentScreen('stats')}
            onProfileClick={handleProfileClick}
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