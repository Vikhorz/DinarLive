
import React from 'react';

export const RateDisplaySkeleton: React.FC = () => {
  const bgColor = 'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';
  const placeholderColor = 'bg-slate-200 dark:bg-slate-700';

  return (
    <div className={`rounded-[1.6rem] p-4 md:p-5 ${bgColor} shadow-sm transition-colors duration-300 animate-pulse`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
           <div className={`p-2 rounded-full ${placeholderColor} w-10 h-10 md:w-11 md:h-11`}></div>
          <div>
            <div className={`h-4 w-24 rounded ${placeholderColor} mb-2`}></div>
            <div className={`h-3 w-32 rounded ${placeholderColor}`}></div>
          </div>
        </div>
        <div className="text-right">
            <div className={`h-8 w-28 md:h-9 md:w-32 rounded ${placeholderColor} mb-2`}></div>
            <div className={`h-4 w-12 rounded ${placeholderColor} ml-auto`}></div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="mb-3 h-2 w-20 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
      </div>
    </div>
  );
};
