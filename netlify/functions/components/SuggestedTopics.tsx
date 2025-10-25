
import React from 'react';

interface SuggestedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
}

export const SuggestedTopics: React.FC<SuggestedTopicsProps> = ({ topics, onTopicClick }) => {
  return (
    <div className="mt-12">
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-3">Suggested Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTopicClick(topic)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-all transform hover:-translate-y-0.5"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
};
