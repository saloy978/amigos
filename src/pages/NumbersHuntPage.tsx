import React from 'react';
import { NumbersHuntGame } from '../components/games/NumbersHuntGame';

interface NumbersHuntPageProps {
  onNavigateBack: () => void;
}

export const NumbersHuntPage: React.FC<NumbersHuntPageProps> = ({ onNavigateBack }) => {
  return (
    <div className="min-h-screen">
      <NumbersHuntGame onNavigateBack={onNavigateBack} />
    </div>
  );
};
