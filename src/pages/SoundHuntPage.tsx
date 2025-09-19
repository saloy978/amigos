import React from 'react';
import { SoundHuntGame } from '../components/games/SoundHuntGame';

interface SoundHuntPageProps {
  onNavigateToHome: () => void;
  onNavigateToNumbersHunt?: () => void;
  onNavigateToArticulosRoulette?: () => void;
}

export const SoundHuntPage: React.FC<SoundHuntPageProps> = ({ onNavigateToHome, onNavigateToNumbersHunt, onNavigateToArticulosRoulette }) => {
  return (
    <div className="min-h-screen">
      <SoundHuntGame 
        onNavigateToHome={onNavigateToHome} 
        onNavigateToNumbersHunt={onNavigateToNumbersHunt}
        onNavigateToArticulosRoulette={onNavigateToArticulosRoulette}
      />
    </div>
  );
};











