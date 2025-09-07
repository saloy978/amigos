import React from 'react';
import { X, Cross as Progress } from 'lucide-react';

interface SessionProgressProps {
  completed: number;
  total: number;
  onEndSession: () => void;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  completed,
  total,
  onEndSession
}) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onEndSession}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-medium text-gray-900">
            {completed} / {total}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {Math.round(progress)}%
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};