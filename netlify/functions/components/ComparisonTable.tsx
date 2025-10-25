
import React from 'react';
import type { ComparisonData } from '../types';

interface ComparisonTableProps {
  data: ComparisonData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  if (!data || !data.comparison || data.comparison.length === 0) {
    return <p>No comparison data available.</p>;
  }

  const { title, papers, comparison } = data;
  const headers = ['Concept', 'Overall Summary', ...papers];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                >
                  {header.replace('.pdf', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {comparison.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-normal w-1/4 align-top">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.concept}</div>
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-slate-500 dark:text-slate-400 w-1/4 align-top">
                  {row.summary}
                </td>
                {papers.map((paperName) => (
                  <td key={paperName} className="px-6 py-4 whitespace-normal text-sm text-slate-600 dark:text-slate-300 align-top">
                    {row[paperName] || <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
