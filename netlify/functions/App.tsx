import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { PaperSearch } from './components/PaperSearch';
import { SearchResults } from './components/SearchResults';
import { SinglePaperView } from './components/SinglePaperView';
import { ComparisonTable } from './components/ComparisonTable';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { DetailedReport } from './components/DetailedReport';
import { KeyInsights } from './components/KeyInsights';
import { ResearchGaps } from './components/ResearchGaps';
import { SuggestedTopics } from './components/SuggestedTopics';
import { Loader } from './components/Loader';
import { Icon } from './components/Icon';
import type { Paper, ComparisonData, GraphData } from './types';
import { searchForPapers, getStructuredComparison, getKnowledgeGraphData, getDetailedReport, summarizePaper, getKeyInsights, getResearchGaps } from './services/geminiService';

type View = 'search' | 'results' | 'analysis';
type ActiveTab = 'comparison' | 'graph' | 'report' | 'insights' | 'gaps';

const App: React.FC = () => {
  const [view, setView] = useState<View>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [detailedReport, setDetailedReport] = useState<string | null>(null);
  const [keyInsights, setKeyInsights] = useState<string | null>(null);
  const [researchGaps, setResearchGaps] = useState<string | null>(null);

  const [singlePaperSummary, setSinglePaperSummary] = useState<string | null>(null);
  const [paperForAbstract, setPaperForAbstract] = useState<Paper | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing Corpus...');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('comparison');

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setLoadingMessage('Searching for papers...');
    setError(null);
    setSearchQuery(query);
    setSelectedPapers([]);
    setSearchResults([]);
    setSuggestedTopics([]);
    setView('search');

    try {
      const result = await searchForPapers(query);
      setSearchResults(result.papers);
      setSuggestedTopics(result.suggestedTopics);
      setView('results');
    } catch (e) {
      console.error(e);
      setError("Failed to fetch search results. Please try again.");
      setView('search');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleToggleSelection = (paper: Paper, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPapers(prev => [...prev, paper]);
    } else {
      setSelectedPapers(prev => prev.filter(p => p.id !== paper.id));
    }
  };
  
  const handleStartAnalysis = useCallback(async () => {
    if (selectedPapers.length < 2) {
      setError("Please select at least two papers to compare.");
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Generating comparative analysis...');
    setError(null);
    setComparisonData(null);
    setGraphData(null);
    setDetailedReport(null);
    setKeyInsights(null);
    setResearchGaps(null);

    try {
      const [comparisonResult, graphResult, reportResult, insightsResult, gapsResult] = await Promise.all([
        getStructuredComparison(searchQuery, selectedPapers),
        getKnowledgeGraphData(searchQuery, selectedPapers),
        getDetailedReport(searchQuery, selectedPapers),
        getKeyInsights(searchQuery, selectedPapers),
        getResearchGaps(searchQuery, selectedPapers),
      ]);
      
      setComparisonData(comparisonResult);
      setGraphData(graphResult);
      setDetailedReport(reportResult);
      setKeyInsights(insightsResult);
      setResearchGaps(gapsResult);

      setActiveTab('comparison');
      setView('analysis');

    } catch (e) {
      console.error(e);
      setError("An error occurred while analyzing the papers. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPapers, searchQuery]);

  const handleViewAbstract = useCallback(async (paper: Paper) => {
    setIsLoading(true);
    setLoadingMessage('Generating abstract...');
    setError(null);
    setPaperForAbstract(paper);
    try {
      const summary = await summarizePaper(paper);
      setSinglePaperSummary(summary);
    } catch (e) {
      console.error(e);
      setError('Failed to generate paper abstract.');
      setSinglePaperSummary(null);
      setPaperForAbstract(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBackFromAbstract = () => {
    setPaperForAbstract(null);
    setSinglePaperSummary(null);
  };
  
  const resetToSearch = () => {
      setView('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPapers([]);
      setComparisonData(null);
      setGraphData(null);
      setDetailedReport(null);
      setKeyInsights(null);
      setResearchGaps(null);
      setError(null);
  }

  const handleBackToResults = () => {
      setView('results');
      setComparisonData(null);
      setGraphData(null);
      setDetailedReport(null);
      setKeyInsights(null);
      setResearchGaps(null);
      setError(null);
  }

  const mainContent = useMemo(() => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }

    if (error) {
       return (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
       );
    }
    
    switch (view) {
      case 'search':
        return (
           <div className="text-center py-16 px-6">
              <Icon name="logo" className="mx-auto h-16 w-16 text-blue-500"/>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Scholarly Knowledge Discovery</h2>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Search for research papers to analyze, compare, and visualize connections.</p>
              <div className="mt-8 max-w-2xl mx-auto">
                 <PaperSearch onSearch={handleSearch} disabled={isLoading} />
              </div>
          </div>
        );
      
      case 'results':
        return (
          <>
            <PaperSearch onSearch={handleSearch} disabled={isLoading} initialQuery={searchQuery} />
            
            {paperForAbstract && singlePaperSummary ? (
                <SinglePaperView paper={paperForAbstract} summary={singlePaperSummary} onBack={handleBackFromAbstract} />
            ) : (
                <>
                  {selectedPapers.length >= 2 && (
                    <div className="my-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center justify-between animate-fade-in">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPapers.length} papers selected for analysis.</span>
                        <button
                            onClick={handleStartAnalysis}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105 flex items-center"
                        >
                            <Icon name="beaker" className="h-5 w-5 mr-2" />
                            Compare Papers
                        </button>
                    </div>
                  )}
                  <SearchResults
                      papers={searchResults}
                      selectedPapers={selectedPapers}
                      onToggleSelection={handleToggleSelection}
                      onViewAbstract={handleViewAbstract}
                  />
                </>
            )}

            {suggestedTopics.length > 0 && !paperForAbstract && (
              <SuggestedTopics topics={suggestedTopics} onTopicClick={handleSearch} />
            )}
          </>
        );

      case 'analysis':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold">Analysis for: "{searchQuery}"</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={handleBackToResults} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2">
                        <Icon name="back" className="h-5 w-5"/>
                        <span>Back to Results</span>
                    </button>
                    <button onClick={resetToSearch} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2">
                        <Icon name="search" className="h-5 w-5"/>
                        <span>New Search</span>
                    </button>
                </div>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700">
              <nav className="flex flex-wrap space-x-1 p-2" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'comparison' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Icon name="table" className="mr-2"/>
                  Structured Comparison
                </button>
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'graph' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Icon name="graph" className="mr-2"/>
                  Knowledge Graph
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'report' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Icon name="document" className="mr-2"/>
                  Detailed Report
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'insights' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Icon name="lightbulb" className="mr-2"/>
                  Key Insights
                </button>
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'gaps' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Icon name="puzzle" className="mr-2"/>
                  Research Gaps
                </button>
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'comparison' && comparisonData && <ComparisonTable data={comparisonData} />}
              {activeTab === 'graph' && graphData && <KnowledgeGraph data={graphData} />}
              {activeTab === 'report' && detailedReport && <DetailedReport report={detailedReport} />}
              {activeTab === 'insights' && keyInsights && <KeyInsights content={keyInsights} />}
              {activeTab === 'gaps' && researchGaps && <ResearchGaps content={researchGaps} />}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [isLoading, loadingMessage, error, view, searchQuery, searchResults, selectedPapers, suggestedTopics, singlePaperSummary, paperForAbstract, comparisonData, graphData, detailedReport, keyInsights, researchGaps, activeTab, handleSearch, handleToggleSelection, handleViewAbstract, handleStartAnalysis]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {mainContent}
        </div>
      </main>
    </div>
  );
};

export default App;
