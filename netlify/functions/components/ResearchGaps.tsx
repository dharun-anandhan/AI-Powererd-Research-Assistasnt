import React, { useEffect, useState } from 'react';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@13.0.0/lib/marked.esm.js';

interface ResearchGapsProps {
  content: string;
}

export const ResearchGaps: React.FC<ResearchGapsProps> = ({ content }) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (content) {
      const parsedHtml = marked.parse(content);
      setHtmlContent(parsedHtml as string);
    }
  }, [content]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Identified Research Gaps</h2>
      <div
        className="prose prose-slate dark:prose-invert max-w-none p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
