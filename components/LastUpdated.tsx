
import React, { useState, useEffect } from 'react';
import type { Translation } from '../types';

interface LastUpdatedProps {
  date: string;
  loading: boolean;
  t: Translation;
  onRefresh: () => void;
  cooldownSeconds: number;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({ date, loading, t }) => {
  const [timeAgo, setTimeAgo] = useState(t.justNow);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    const update = () => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        setIsCached(seconds > 35 * 60);

        if (seconds < 5) {
            setTimeAgo(t.justNow);
        } else if (seconds < 60) {
            setTimeAgo(t.secondsAgo(seconds));
        } else {
             setTimeAgo(new Date(date).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit'
             }));
        }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [date, loading, t]);
  
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-1 transition-colors duration-300">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {loading ? (
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    <span>{t.updatingRates}</span>
                </div>
            ) : (
                <>
                <div className="relative flex h-3 w-3">
                    {isCached ? (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                    ) : (
                        <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </>
                    )}
                </div>
                <span>{t.updated} {timeAgo}</span>
                {isCached && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">Cached</span>}
                </>
            )}
        </div>
        <div className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wider">
            {formattedDate}
        </div>
    </div>
  );
};
