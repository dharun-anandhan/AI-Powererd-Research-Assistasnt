
import React from 'react';
import type { Paper } from '../types';
import { LibraryIcon } from './icons/LibraryIcon';

interface ResultItemProps {
    paper: Paper;
    isSelected: boolean;
    onToggleSelect: () => void;
    onAddToLibrary: () => void;
    onShowDetails: () => void;
}

const ResultItem: React.FC<ResultItemProps> = ({ paper, isSelected, onToggleSelect, onAddToLibrary, onShowDetails }) => {
    return (
        <div className={`p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800/40 border-slate-700 hover:border-cyan-500/50'}`}>
            <div className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-600"
                />
                <div className="flex-1">
                    <h3 
                        className="font-semibold text-slate-100 cursor-pointer hover:text-cyan-400 transition-colors"
                        onClick={onShowDetails}
                        title="View details"
                    >
                        {paper.title}
                    </h3>
                    <p className="text-sm text-slate-400">{paper.authors.join(', ')} - {paper.year}</p>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-200">TLDR: </span>{paper.tldr}
                    </p>
                </div>
                 <button onClick={onAddToLibrary} title="Add to Library" className="p-2 text-slate-400 hover:text-cyan-400 rounded-full hover:bg-slate-700 transition-colors">
                    <LibraryIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default ResultItem;