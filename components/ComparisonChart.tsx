import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ComparisonAspect, ComparisonPoint } from '../types';

interface ComparisonChartProps {
    comparison: ComparisonAspect[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ comparison }) => {
    const methodologyAspect = comparison.find(c => c.aspect.toLowerCase() === 'methodology');
    
    if (!methodologyAspect) {
        return <p className="text-center text-slate-500">Cannot generate chart: 'Methodology' aspect not found.</p>;
    }

    const chartData = Object.entries(methodologyAspect.papers).map(([paperId, data]: [string, ComparisonPoint]) => ({
        name: `Paper ${paperId}`,
        confidence: data.confidenceScore * 100,
    }));

    return (
        <div className="h-80 w-full">
            <h4 className="text-center font-semibold text-slate-300 mb-4">Confidence Score for Methodology</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis unit="%" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[80, 100]} />
                    <Tooltip
                        cursor={{ fill: 'rgba(34,211,238,0.1)' }}
                        contentStyle={{
                            backgroundColor: '#1e2937',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            color: '#e2e8f0',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar dataKey="confidence" fill="#22d3ee" name="Confidence Score" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ComparisonChart;