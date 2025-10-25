
import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Icon name="logo" className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
              Scholarly AI
            </h1>
          </div>
          <div className="flex items-center">
            {/* Dark mode toggle or other actions can go here */}
          </div>
        </div>
      </div>
    </header>
  );
};
