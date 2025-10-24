import React, { useState } from 'react';
import type { Paper } from '../types';
import { AlertIcon } from './icons/AlertIcon';
import { LibraryIcon } from './icons/LibraryIcon';

interface HeaderProps {
    alerts: string[];
    library: Paper[];
}

const Header: React.FC<HeaderProps> = ({ alerts, library }) => {
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    return (
        <header className="bg-black/30 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <span className="text-lg font-bold text-slate-100">AISKDS</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                             <button onClick={() => setIsAlertsOpen(!isAlertsOpen)} className="p-2 rounded-full hover:bg-slate-800 relative">
                                <AlertIcon />
                                {alerts.length > 0 && (
                                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-900"></span>
                                )}
                            </button>
                             {isAlertsOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg border border-slate-700">
                                    <div className="p-2 text-sm font-semibold border-b border-slate-700 text-slate-200">Notifications</div>
                                    <ul className="py-1 max-h-60 overflow-y-auto">
                                        {alerts.slice(-5).reverse().map((alert, index) => (
                                            <li key={index} className="px-4 py-2 text-sm text-slate-300">{alert}</li>
                                        ))}
                                    </ul>
                                </div>
                             )}
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsLibraryOpen(!isLibraryOpen)} className="p-2 rounded-full hover:bg-slate-800 relative">
                                <LibraryIcon />
                                {library.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center text-xs text-white bg-cyan-600 rounded-full h-5 w-5">
                                        {library.length}
                                    </span>
                                )}
                            </button>
                             {isLibraryOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-md shadow-lg border border-slate-700">
                                    <div className="p-2 text-sm font-semibold border-b border-slate-700 text-slate-200">My Library</div>
                                    <ul className="py-1 max-h-60 overflow-y-auto">
                                        {library.length > 0 ? library.map(paper => (
                                            <li key={paper.id} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50">
                                                <p className="font-semibold truncate text-slate-100">{paper.title}</p>
                                                <p className="text-xs text-slate-400">{paper.authors.join(', ')} ({paper.year})</p>
                                            </li>
                                        )) : <li className="px-4 py-2 text-sm text-slate-500">Your library is empty.</li>}
                                    </ul>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;