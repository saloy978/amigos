import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UserCardWithContent, LanguagePair, SessionStats, UserStats } from '../types';

interface AppState {
  languagePairs: LanguagePair[];
  currentLanguagePair: LanguagePair | null;
  cards: UserCardWithContent[];
  currentCard: UserCardWithContent | null;
  sessionStats: SessionStats;
  userStats: UserStats;
  isSessionActive: boolean;
}

type AppAction =
  | { type: 'SET_LANGUAGE_PAIRS'; payload: LanguagePair[] }
  | { type: 'SET_CURRENT_LANGUAGE_PAIR'; payload: LanguagePair | null }
  | { type: 'SET_CARDS'; payload: UserCardWithContent[] }
  | { type: 'UPDATE_CARD'; payload: UserCardWithContent }
  | { type: 'SET_CURRENT_CARD'; payload: UserCardWithContent | null }
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'UPDATE_SESSION_STATS'; payload: Partial<SessionStats> }
  | { type: 'UPDATE_USER_STATS'; payload: Partial<UserStats> }
  | { type: 'ADD_CARD'; payload: UserCardWithContent };

const initialState: AppState = {
  languagePairs: [],
  currentLanguagePair: null,
  cards: [],
  currentCard: null,
  sessionStats: {
    cardsReviewed: 0,
    correctAnswers: 0,
    timeSpent: 0,
    newCards: 0,
    reviewCards: 0
  },
  userStats: {
    streak: 0,
    totalCards: 0,
    learnedCards: 0,
    masteredCards: 0,
    reviewsDue: 0
  },
  isSessionActive: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE_PAIRS':
      return { ...state, languagePairs: action.payload };
    
    case 'SET_CURRENT_LANGUAGE_PAIR':
      return { ...state, currentLanguagePair: action.payload };
    
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    
    case 'UPDATE_CARD':
      console.log('🔄 AppContext: UPDATE_CARD action received');
      console.log('🔄 AppContext: Payload:', action.payload);
      console.log('🔄 AppContext: Current cards count:', state.cards.length);
      
      const updatedCards = state.cards.map(card => {
        if (card.cardId === action.payload.cardId) {
          console.log('🔄 AppContext: Updating card:', card.cardId);
          return action.payload;
        }
        return card;
      });
      
      console.log('🔄 AppContext: Updated cards count:', updatedCards.length);
      return {
        ...state,
        cards: updatedCards
      };
    
    case 'ADD_CARD':
      console.log('🔄 AppContext: Adding card to state:', action.payload);
      const newCardsArray = [...state.cards, action.payload];
      console.log('🔄 AppContext: New cards array length:', newCardsArray.length);
      return {
        ...state,
        cards: newCardsArray
      };
    
    case 'SET_CURRENT_CARD':
      return { ...state, currentCard: action.payload };
    
    case 'START_SESSION':
      return { ...state, isSessionActive: true };
    
    case 'END_SESSION':
      return { ...state, isSessionActive: false, currentCard: null };
    
    case 'UPDATE_SESSION_STATS':
      return {
        ...state,
        sessionStats: { ...state.sessionStats, ...action.payload }
      };
    
    case 'UPDATE_USER_STATS':
      return {
        ...state,
        userStats: { ...state.userStats, ...action.payload }
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};