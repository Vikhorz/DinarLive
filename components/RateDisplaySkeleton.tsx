
import React from 'react';

export const RateDisplaySkeleton: React.FC = () => {
  return (
    <div className="theme-surface-card theme-border theme-shadow-soft rounded-lg border p-4 md:p-5 shadow-sm transition-colors duration-300 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
           <div className="theme-surface-muted p-2 rounded-full w-10 h-10 md:w-11 md:h-11"></div>
          <div>
            <div className="theme-surface-muted h-4 w-24 rounded mb-2"></div>
            <div className="theme-surface-muted h-3 w-32 rounded"></div>
          </div>
        </div>
        <div className="text-right">
            <div className="theme-surface-muted h-8 w-28 md:h-9 md:w-32 rounded mb-2"></div>
            <div className="theme-surface-muted h-4 w-12 rounded ml-auto"></div>
        </div>
      </div>
      <div className="theme-border mt-6 border-t pt-4">
          <div className="theme-surface-muted mb-3 h-2 w-20 rounded"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="theme-surface-muted h-12 rounded"></div>
            <div className="theme-surface-muted h-12 rounded"></div>
            <div className="theme-surface-muted h-12 rounded"></div>
          </div>
      </div>
    </div>
  );
};
