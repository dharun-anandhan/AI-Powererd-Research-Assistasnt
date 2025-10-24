import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Paper, ComparisonResult, KGData } from './types';
import { deepSemanticSearch, comparePapers, generateKnowledgeGraphData, suggestBroaderTopics } from './services/geminiService';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import ComparisonModule from './components/ComparisonModule';
import { Spinner } from './components/ui/Spinner';
import PaperDetailModal from './components/PaperDetailModal';
import BroaderSearch from './components/BroaderSearch';


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [searchResults, setSearchResults] = useState<Paper[]>([]);
    const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
    const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
    const [kgData, setKgData] = useState<KGData | null>(null);

    const [library, setLibrary] = useState<Paper[]>([]);
    const [alerts, setAlerts] = useState<string[]>([]);
    
    const [page, setPage] = useState<'search' | 'compare'>('search');
    
    const [detailedPaper, setDetailedPaper] = useState<Paper | null>(null);
    const [broaderTopics, setBroaderTopics] = useState<string[]>([]);

    const handleSearch = useCallback(async (query: string, systematic: boolean) => {
        setIsLoading(true);
        setError(null);
        setComparisonData(null);
        setKgData(null);
        setSelectedPaperIds(new Set());
        setSearchResults([]);
        setBroaderTopics([]);
        try {
            const results = await deepSemanticSearch(query, systematic);
            setSearchResults(results);
            setAlerts(prev => [...prev, `Search complete. Found ${results.length} papers.`]);
            
            if(results.length > 0) {
                const topics = await suggestBroaderTopics(query, results);
                setBroaderTopics(topics);
            }

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during search.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTogglePaperSelection = useCallback((paperId: string) => {
        setSelectedPaperIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paperId)) {
                newSet.delete(paperId);
            } else {
                newSet.add(paperId);
            }
            return newSet;
        });
    }, []);

    const selectedPapers = useMemo(() => {
        return searchResults.filter(p => selectedPaperIds.has(p.id));
    }, [searchResults, selectedPaperIds]);

    const handleCompare = useCallback(async () => {
        if (selectedPapers.length < 2) {
            setError('Please select at least two papers to compare.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setComparisonData(null);
        setKgData(null);

        try {
            const [comparison, kg] = await Promise.all([
                comparePapers(selectedPapers),
                generateKnowledgeGraphData(selectedPapers)
            ]);
            setComparisonData(comparison);
            setKgData(kg);
            if (comparison.researchGaps.length > 0) {
                 setAlerts(prev => [...prev, `New research gaps identified!`]);
            }
            setPage('compare'); // Navigate to compare page on success
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during comparison.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedPapers]);
    
    const handleAddToLibrary = useCallback((paper: Paper) => {
        if (!library.find(p => p.id === paper.id)) {
            setLibrary(prev => [...prev, paper]);
            setAlerts(prev => [...prev, `"${paper.title}" added to library.`]);
        }
    }, [library]);

    const handleReturnToSearch = () => {
        setPage('search');
    };

    const handleShowDetails = (paper: Paper) => {
        setDetailedPaper(paper);
    };

    const handleCloseDetails = () => {
        setDetailedPaper(null);
    };

    const modalRoot = document.getElementById('modal-root');


    return (
        <div className="min-h-screen font-sans bg-gray-900 text-slate-300 relative overflow-x-hidden">
             {detailedPaper && modalRoot && ReactDOM.createPortal(
                <PaperDetailModal paper={detailedPaper} onClose={handleCloseDetails} />,
                modalRoot
            )}

            <div className="absolute top-0 left-0 w-full h-full z-0 opacity-50">
                <div className="absolute top-[-20%] left-[10%] w-[40rem] h-[40rem] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute top-[10%] right-[5%] w-[30rem] h-[30rem] bg-fuchsia-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>
            
            <div className="relative z-10">
                <Header alerts={alerts} library={library} />
                
                {page === 'search' && (
                     <main className="p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 text-center">Scholarly Knowledge Discovery</h1>
                            <p className="text-center text-slate-400 mt-2 mb-8">Harnessing AI for deep semantic search and systematic literature analysis.</p>

                            <SearchBar onSearch={handleSearch} />

                            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div>
                                    <div className="bg-black/20 backdrop-blur-md p-6 rounded-lg shadow-lg border border-slate-700">
                                         <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-slate-200">Search Results</h2>
                                            {selectedPaperIds.size > 0 && <span className="text-sm font-medium text-cyan-400">{selectedPaperIds.size} selected</span>}
                                         </div>
                                        {searchResults.length > 0 ? (
                                            <ResultsList
                                                papers={searchResults}
                                                selectedPaperIds={selectedPaperIds}
                                                onToggleSelect={handleTogglePaperSelection}
                                                onAddToLibrary={handleAddToLibrary}
                                                onShowDetails={handleShowDetails}
                                            />
                                        ) : (
                                            <div className="text-center py-10 text-slate-500">
                                                <p>Enter a query to begin your research.</p>
                                            </div>
                                        )}
                                    </div>
                                    {broaderTopics.length > 0 && (
                                        <BroaderSearch topics={broaderTopics} onTopicClick={(topic) => handleSearch(topic, false)} />
                                    )}
                                </div>


                                <div className="sticky top-24">
                                     <div className="bg-black/20 backdrop-blur-md p-6 rounded-lg shadow-lg border border-slate-700 min-h-[400px]">
                                        <h2 className="text-xl font-semibold text-slate-200 mb-4">AI Analysis</h2>
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-10">
                                            {selectedPapers.length < 2 ? (
                                                <p>Select two or more papers to analyse.</p>
                                            ) : (
                                                <>
                                                    <p className="mb-4">Ready to analyze {selectedPapers.length} selected papers.</p>
                                                    <button 
                                                        onClick={handleCompare}
                                                        disabled={isLoading}
                                                        className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:bg-cyan-400 disabled:bg-cyan-800 disabled:shadow-none disabled:text-slate-400 transition-all text-md font-bold"
                                                    >
                                                        ✨ Analyse Papers
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}

                {page === 'compare' && comparisonData && kgData && (
                    <main className="p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-100">AI Analysis & Comparison</h1>
                                <button onClick={handleReturnToSearch} className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors text-sm font-semibold">
                                    &larr; Back to Search
                                </button>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md p-6 rounded-lg shadow-lg border border-slate-700">
                                <ComparisonModule comparisonResult={comparisonData} kgData={kgData} />
                            </div>
                        </div>
                    </main>
                )}


                 {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <Spinner />
                    </div>
                )}
                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-900/80 backdrop-blur-sm border border-red-500 text-red-200 px-4 py-3 rounded-lg shadow-lg z-50" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                            <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;