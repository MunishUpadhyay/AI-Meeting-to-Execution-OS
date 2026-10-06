import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
      <p className="text-slate-400 font-medium text-sm animate-pulse">{message}</p>
    </div>
  );
};
