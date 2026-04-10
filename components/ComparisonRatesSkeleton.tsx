import React from 'react';

export const ComparisonRatesSkeleton: React.FC = () => {
    const placeholderColor = 'bg-slate-200 dark:bg-slate-700';

    const SkeletonItem = () => (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className={`h-4 w-16 rounded ${placeholderColor} mx-auto mb-2`}></div>
            <div className={`h-6 w-24 rounded ${placeholderColor} mx-auto`}></div>
        </div>
    );

    return (
        <div className="mt-6 rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900">
            <div className={`h-5 w-40 rounded ${placeholderColor} mx-auto mb-3`}></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
            </div>
        </div>
    );
};
