
import React, { useState } from 'react';
import type { ComparisonResult, KGData } from '../types';
import ComparisonTable from './ComparisonTable';
import ComparisonChart from './ComparisonChart';
import KnowledgeGraph from './KnowledgeGraph';

interface ComparisonModuleProps {
    comparisonResult: ComparisonResult;
    kgData: KGData;
}

type View = 'table' | 'chart' | 'graph' | 'gaps' | 'synthesis';

const ViewTab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active ? 'bg-cyan-500 text-gray-900' : 'text-slate-400 hover:bg-slate-700/50'
    }`}
  >
    {children}
  </button>
);


const ComparisonModule: React.FC<ComparisonModuleProps> = ({ comparisonResult, kgData }) => {
    const [activeView, setActiveView] = useState<View>('table');

    return (
        <div className="space-y-4">
            <div className="border-b border-slate-700">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <ViewTab active={activeView === 'table'} onClick={() => setActiveView('table')}>Comparison Table</ViewTab>
                    <ViewTab active={activeView === 'chart'} onClick={() => setActiveView('chart')}>Metrics Chart</ViewTab>
                    <ViewTab active={activeView === 'graph'} onClick={() => setActiveView('graph')}>Knowledge Graph</ViewTab>
                    <ViewTab active={activeView === 'gaps'} onClick={() => setActiveView('gaps')}>Research Gaps</ViewTab>
                     <ViewTab active={activeView === 'synthesis'} onClick={() => setActiveView('synthesis')}>Synthesis</ViewTab>
                </nav>
            </div>

            <div className="prose prose-sm max-w-none prose-slate prose-invert">
                {activeView === 'table' && <ComparisonTable comparison={comparisonResult.comparison} />}
                {activeView === 'chart' && <ComparisonChart comparison={comparisonResult.comparison} />}
                {activeView === 'graph' && <KnowledgeGraph data={kgData} />}
                {activeView === 'synthesis' && (
                    <div>
                        <h3 className="font-semibold text-base text-slate-200">Overall Synthesis</h3>
                        <p>{comparisonResult.overallSynthesis}</p>
                        <h3 className="mt-4 font-semibold text-base text-slate-200">Generated Hypothesis</h3>
                        {comparisonResult.hypothesis && comparisonResult.hypothesis.trim() !== '' ? (
                            <p className="italic">"{comparisonResult.hypothesis}"</p>
                        ) : (
                            <p className="text-slate-400">No specific hypothesis was generated from the selected papers.</p>
                        )}
                    </div>
                )}
                {activeView === 'gaps' && (
                    <div>
                        <h3 className="font-semibold text-base text-slate-200">Identified Research Gaps</h3>
                        <ul className="list-disc pl-5">
                            {comparisonResult.researchGaps.map((gap, index) => (
                                <li key={index}>{gap}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparisonModule;