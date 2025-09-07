import React from 'react';
import { BookOpen, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  onSettingsClick?: () => void;
  showSettings?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onSettingsClick, 
  showSettings = true 
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      
      {showSettings && (
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </header>
  );
};