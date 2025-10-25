
import React from 'react';
import { Icon } from './Icon';

interface FileUploadProps {
  onFileUpload: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  return (
    <div className="text-center mb-4">
      <button
        onClick={onFileUpload}
        className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <Icon name="upload" className="h-5 w-5"/>
        <span>Load Example Papers</span>
      </button>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        This will load 3 foundational NLP papers for analysis.
      </p>
    </div>
  );
};
