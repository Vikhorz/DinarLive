import React from 'react';
import type { Translation } from '../types';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullPosition: number;
  threshold: number;
  t: Translation;
}

const ArrowIcon: React.FC<{ rotation: number }> = ({ rotation }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-200"
    style={{ transform: `rotate(${rotation}deg)` }}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-6 w-6 theme-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ isRefreshing, pullPosition, threshold, t }) => {
  const opacity = Math.min(pullPosition / threshold, 1);
  const rotation = Math.min((pullPosition / threshold) * 180, 180);

  // Don't render the component if it's not being pulled and not refreshing
  if (pullPosition === 0 && !isRefreshing) {
    return null;
  }
  
  return (
    <div 
        className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center transition-opacity duration-200"
        style={{ opacity: isRefreshing ? 1 : opacity }}
        aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
            {isRefreshing ? <SpinnerIcon /> : <ArrowIcon rotation={rotation} />}
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t.pullToRefresh}</span>
      </div>
    </div>
  );
};
