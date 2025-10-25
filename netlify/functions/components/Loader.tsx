
import React from 'react';
import { Icon } from './Icon';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <Icon name="loader" className="h-10 w-10 text-blue-600 animate-spin" />
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{message}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">The AI is synthesizing insights. This may take a moment.</p>
      </div>
    </div>
  );
};
