
import React, { useState } from 'react';
import { Icon } from './Icon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="search-query" className="block text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">
        Analysis Query
      </label>
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            placeholder="e.g., Compare model architectures and key innovations..."
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center"
        >
          <Icon name="beaker" className="h-5 w-5 mr-2" />
          Analyze
        </button>
      </div>
    </form>
  );
};
