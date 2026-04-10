import React from 'react';

const SVG_WIDTH = 380;
const SVG_HEIGHT = 180;

export const RateHistoryChartSkeleton: React.FC = () => {
  const placeholderColor = "bg-slate-200 dark:bg-slate-700";
  
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto">
             <path d={`M 55,120 C 120,40 250,160 360,90`} fill="none" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2.5" />
             
             {/* Y-Axis labels */}
             <rect x="10" y="28" width="35" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
             <rect x="10" y="68" width="35" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
             <rect x="10" y="108" width="35" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
             <rect x="10" y="148" width="35" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
             
             {/* X-Axis labels */}
             <rect x="50" y="160" width="60" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
             <rect x="290" y="160" width="60" height="10" rx="3" className="fill-current text-slate-300 dark:text-slate-600" />
        </svg>
    </div>
  );
};
