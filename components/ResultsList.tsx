
import React from 'react';
import type { Paper } from '../types';
import ResultItem from './ResultItem';

interface ResultsListProps {
    papers: Paper[];
    selectedPaperIds: Set<string>;
    onToggleSelect: (paperId: string) => void;
    onAddToLibrary: (paper: Paper) => void;
    onShowDetails: (paper: Paper) => void;
}

const ResultsList: React.FC<ResultsListProps> = ({ papers, selectedPaperIds, onToggleSelect, onAddToLibrary, onShowDetails }) => {
    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {papers.map((paper) => (
                <ResultItem
                    key={paper.id}
                    paper={paper}
                    isSelected={selectedPaperIds.has(paper.id)}
                    onToggleSelect={() => onToggleSelect(paper.id)}
                    onAddToLibrary={() => onAddToLibrary(paper)}
                    onShowDetails={() => onShowDetails(paper)}
                />
            ))}
        </div>
    );
};

export default ResultsList;