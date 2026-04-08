
import React from 'react';

export const RateDisplaySkeleton: React.FC = () => {
  const bgColor = 'bg-gray-50 dark:bg-gray-900/40';
  const placeholderColor = 'bg-gray-200 dark:bg-gray-700';

  return (
    <div className={`p-4 md:p-5 rounded-xl ${bgColor} transition-colors duration-300 animate-pulse`}>
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
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50">
          <div className="h-2 w-20 rounded bg-gray-200 dark:bg-gray-700 mb-3"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-700/50"></div>
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-700/50"></div>
            <div className="h-12 rounded bg-gray-200 dark:bg-gray-700/50"></div>
          </div>
      </div>
    </div>
  );
};
