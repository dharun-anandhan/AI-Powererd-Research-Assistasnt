import React from 'react';
import type { ComparisonAspect } from '../types';
import { Tooltip } from './ui/Tooltip';
import { TraceIcon } from './icons/TraceIcon';

interface ComparisonTableProps {
    comparison: ComparisonAspect[];
}

const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = Math.round(score * 100);
    const getColor = () => {
        if (score > 0.95) return 'bg-green-100 text-green-800';
        if (score > 0.9) return 'bg-yellow-100 text-yellow-800';
        return 'bg-orange-100 text-orange-800';
    };
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getColor()}`}>
            {percentage}%
        </span>
    );
};


const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparison }) => {
    if (!comparison || comparison.length === 0) {
        return <p>No comparison data available.</p>;
    }
    const paperIds = Object.keys(comparison[0].papers);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700 border border-slate-700 rounded-lg">
                <thead className="bg-slate-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Aspect
                        </th>
                        {paperIds.map(id => (
                            <th key={id} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Paper {id}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-slate-700">
                    {comparison.map(({ aspect, papers }) => (
                        <tr key={aspect}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-100 align-top">{aspect}</td>
                            {paperIds.map(id => {
                                const data = papers[id];
                                return (
                                    <td key={id} className="px-4 py-4 whitespace-normal text-sm text-slate-300 align-top">
                                        {data ? (
                                            <>
                                                <p>{data.value}</p>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <ConfidenceBadge score={data.confidenceScore} />
                                                    <Tooltip content={`Source: "${data.sourceSentence}"`}>
                                                        <span className="text-slate-400 hover:text-cyan-400 cursor-pointer">
                                                           <TraceIcon />
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-slate-500 italic">N/A</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ComparisonTable;