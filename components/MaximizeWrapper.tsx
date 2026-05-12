import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MaximizeWrapperProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const MaximizeWrapper: React.FC<MaximizeWrapperProps> = ({ title, children, className = '' }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <>
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" 
          onClick={() => setIsMaximized(false)} 
        />
      )}
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col ${className} ${isMaximized ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="text-lg font-bold text-slate-800 flex-1 w-full">{title}</div>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
        <div className={`flex-1 flex flex-col min-h-0 ${isMaximized ? 'min-h-[60vh]' : ''}`}>
          {children}
        </div>
      </div>
    </>
  );
};
