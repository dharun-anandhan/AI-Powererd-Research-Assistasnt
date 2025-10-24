
import React from 'react';

interface BroaderSearchProps {
    topics: string[];
    onTopicClick: (topic: string) => void;
}

const BroaderSearch: React.FC<BroaderSearchProps> = ({ topics, onTopicClick }) => {
    return (
        <div className="mt-8 bg-black/20 backdrop-blur-md p-6 rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Explore Broader Topics</h3>
            <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                    <button
                        key={index}
                        onClick={() => onTopicClick(topic)}
                        className="px-3 py-1.5 bg-slate-700 text-slate-200 text-sm rounded-full hover:bg-cyan-500 hover:text-gray-900 transition-colors font-medium"
                    >
                        {topic}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BroaderSearch;