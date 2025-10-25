
import React from 'react';
import type { Paper } from '../types';
import { Icon } from './Icon';

interface PaperListProps {
  papers: Paper[];
  onRemovePaper: (id: string) => void;
}

export const PaperList: React.FC<PaperListProps> = ({ papers, onRemovePaper }) => {
  if (papers.length === 0) {
    return <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No papers loaded.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-md font-semibold text-slate-600 dark:text-slate-400 px-1">Loaded Papers</h3>
      <ul className="space-y-2">
        {papers.map((paper) => (
          <li
            key={paper.id}
            className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg"
          >
            <div className="flex items-center min-w-0">
              <Icon name="document" className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="ml-3 text-sm font-medium truncate text-slate-700 dark:text-slate-300" title={paper.name}>
                {paper.name}
              </span>
            </div>
            <button
              onClick={() => onRemovePaper(paper.id)}
              className="ml-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
              aria-label={`Remove ${paper.name}`}
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
