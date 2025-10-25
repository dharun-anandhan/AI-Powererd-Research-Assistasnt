
import React from 'react';
import type { Paper } from '../types';

interface SearchResultsProps {
  papers: Paper[];
  selectedPapers: Paper[];
  onToggleSelection: (paper: Paper, isSelected: boolean) => void;
  onViewAbstract: (paper: Paper) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ papers, selectedPapers, onToggleSelection, onViewAbstract }) => {
  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No papers found for this query.</p>
      </div>
    );
  }

  const isSelected = (paperId: string) => {
    return selectedPapers.some(p => p.id === paperId);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Search Results</h2>
      <p className="text-slate-500 dark:text-slate-400">
        Click a paper's title to view its abstract, or use the checkboxes to select papers for comparison.
      </p>
      <ul className="space-y-6">
        {papers.map((paper) => (
          <li key={paper.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg transition-all border-2 border-transparent hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                id={`paper-${paper.id}`}
                checked={isSelected(paper.id)}
                onChange={(e) => onToggleSelection(paper, e.target.checked)}
                className="h-6 w-6 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-700 mt-1"
              />
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                   <button 
                    onClick={() => onViewAbstract(paper)}
                    className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`View abstract for ${paper.name}`}
                  >
                    {paper.name}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {paper.content}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
