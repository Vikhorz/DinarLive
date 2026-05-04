import React, { useState, useEffect, useMemo } from 'react';
import type { Translation } from '../types';

interface HeaderProps {
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({ t }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const conversions = useMemo(
    () => [`${t.usd} ↔ ${t.iqd}`, `${t.eur} ↔ ${t.iqd}`, `${t.gbp} ↔ ${t.iqd}`, `${t.try} ↔ ${t.iqd}`, `${t.irt} ↔ ${t.iqd}`],
    [t],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % conversions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversions]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center xl:mx-0 xl:items-start xl:text-start">
      <h1 className="max-w-[15ch] text-[2.35rem] font-black leading-[1.12] text-slate-900 dark:text-white sm:text-5xl lg:max-w-2xl lg:text-6xl">
        {t.headerTitle}
      </h1>

      <div className="relative mt-4 flex h-12 w-full max-w-md items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:mt-5 sm:h-14 sm:max-w-xl xl:justify-start">
        <p key={activeIdx} className="text-[0.92rem] font-black text-sky-700 dark:text-sky-300 sm:text-base animate-slide-fade lg:text-lg">
          {conversions[activeIdx]}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300 sm:mt-4 sm:text-lg">{t.headerSubtitle}</p>

      <style>{`
        @keyframes slideFade {
          0% { transform: translateY(18px); opacity: 0; }
          15% { transform: translateY(0); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-18px); opacity: 0; }
        }

        .animate-slide-fade {
          animation: slideFade 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
