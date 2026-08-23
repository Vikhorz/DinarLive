import React from 'react';

export const ComparisonRatesSkeleton: React.FC = () => {
    const SkeletonItem = () => (
        <div className="theme-border rounded-lg border p-3 text-center">
            <div className="theme-surface-muted h-4 w-16 rounded mx-auto mb-2"></div>
            <div className="theme-surface-muted h-6 w-24 rounded mx-auto"></div>
        </div>
    );

    return (
        <div className="theme-surface-card theme-border theme-shadow-soft mt-6 rounded-lg border p-5 shadow-sm animate-pulse">
            <div className="theme-surface-muted h-5 w-40 rounded mx-auto mb-3"></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
            </div>
        </div>
    );
};
