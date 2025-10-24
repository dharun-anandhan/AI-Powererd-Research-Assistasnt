import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string, systematic: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState<string>('Transformers in NLP');
    const [systematic, setSystematic] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim(), systematic);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-black/30 p-2 rounded-full shadow-lg border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
            <div className="flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a deep semantic search query..."
                    className="w-full bg-transparent px-4 py-2 text-slate-200 focus:outline-none placeholder-slate-500"
                />
                <div className="flex items-center space-x-2 pr-2">
                    <label htmlFor="systematic-toggle" className="text-sm text-slate-400 cursor-pointer whitespace-nowrap">Systematic Review</label>
                    <button
                        type="button"
                        id="systematic-toggle"
                        onClick={() => setSystematic(!systematic)}
                        className={`${
                            systematic ? 'bg-cyan-500' : 'bg-slate-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                        <span
                            className={`${
                                systematic ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
                <button type="submit" className="bg-cyan-500 text-gray-900 rounded-full p-2.5 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors">
                    <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </form>
    );
};

export default SearchBar;