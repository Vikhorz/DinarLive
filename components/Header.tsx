
import React, { useState, useEffect, useMemo } from 'react';
import type { Translation } from '../types';

interface HeaderProps {
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({ t }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const conversions = useMemo(() => [
    `${t.usd} ↔ ${t.iqd}`,
    `${t.eur} ↔ ${t.iqd}`,
    `${t.gbp} ↔ ${t.iqd}`,
    `${t.try} ↔ ${t.iqd}`,
    `${t.irt} ↔ ${t.iqd}`,
  ], [t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % conversions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversions]);

  return (
    <div className="text-center flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white transition-colors duration-300 tracking-tight leading-tight">
            {t.headerTitle}
        </h2>
        
        {/* Animated Conversion Text - Optimized Container Height to Prevent Clipping */}
        <div className="relative h-10 sm:h-12 overflow-hidden mt-3 flex items-center justify-center w-full max-w-xs sm:max-w-md">
            <p key={activeIdx} className="text-sm sm:text-xl text-sky-600 dark:text-sky-400 font-bold animate-slide-fade uppercase tracking-widest whitespace-nowrap leading-none py-1">
                {conversions[activeIdx]}
            </p>
        </div>

        <p className="mt-1 text-base md:text-lg font-medium text-gray-500 dark:text-gray-400 transition-colors duration-300">
            {t.headerSubtitle}
        </p>

        <style>{`
          @keyframes slideFade {
            0% { transform: translateY(30px); opacity: 0; }
            15% { transform: translateY(0); opacity: 1; }
            85% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-30px); opacity: 0; }
          }
          .animate-slide-fade { 
            animation: slideFade 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
    </div>
  );
};
