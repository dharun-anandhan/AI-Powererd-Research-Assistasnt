
import React from 'react';
import { Paper } from '../types';
import { Icon } from './Icon';

interface SinglePaperViewProps {
  paper: Paper;
  summary: string;
  onBack: () => void;
}

export const SinglePaperView: React.FC<SinglePaperViewProps> = ({ paper, summary, onBack }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pr-4">{paper.name}</h2>
          <button 
            onClick={onBack} 
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 text-sm flex-shrink-0"
          >
              <Icon name="back" className="h-4 w-4"/>
              <span>Back to Results</span>
          </button>
      </div>
      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-4 mb-2">Generated Abstract</h3>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>{summary}</p>
      </div>
    </div>
  );
};
