import React from 'react';
import { ArticulosRouletteGame } from '../components/articulos-roulette/ArticulosRouletteGame';

interface ArticulosRoulettePageProps {
  onNavigateBack: () => void;
}

export const ArticulosRoulettePage: React.FC<ArticulosRoulettePageProps> = ({ onNavigateBack }) => {
  return (
    <div className="min-h-screen">
      <ArticulosRouletteGame onNavigateBack={onNavigateBack} />
    </div>
  );
};
