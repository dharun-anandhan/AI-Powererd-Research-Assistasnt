
import React from 'react';
import type { Paper } from '../types';

interface PaperDetailModalProps {
    paper: Paper;
    onClose: () => void;
}

const PaperDetailModal: React.FC<PaperDetailModalProps> = ({ paper, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-slate-100 pr-4">{paper.title}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                        <span>{paper.year}</span> &bull; <span>{paper.authors.join(', ')}</span>
                    </div>

                    <div className="mt-6 prose prose-sm max-w-none prose-slate prose-invert">
                        <h3 className="text-slate-200">Abstract</h3>
                        <p>{paper.abstract}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperDetailModal;