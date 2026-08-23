import React from 'react';

const SVG_WIDTH = 380;
const SVG_HEIGHT = 180;

export const RateHistoryChartSkeleton: React.FC = () => {
  return (
    <div className="theme-surface-card theme-border theme-shadow-soft rounded-lg border p-4 shadow-sm animate-pulse">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto">
             <path d={`M 55,120 C 120,40 250,160 360,90`} fill="none" className="theme-text-secondary stroke-current opacity-40" strokeWidth="2.5" />

             {/* Y-Axis labels */}
             <rect x="10" y="28" width="35" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />
             <rect x="10" y="68" width="35" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />
             <rect x="10" y="108" width="35" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />
             <rect x="10" y="148" width="35" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />

             {/* X-Axis labels */}
             <rect x="50" y="160" width="60" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />
             <rect x="290" y="160" width="60" height="10" rx="3" className="theme-text-secondary fill-current opacity-40" />
        </svg>
    </div>
  );
};
