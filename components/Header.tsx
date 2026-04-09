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
      <h1 className="max-w-2xl text-4xl font-black leading-[1.1] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
        {t.headerTitle}
      </h1>

      <div className="relative mt-5 flex h-14 w-full max-w-xl items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 xl:justify-start">
        <p key={activeIdx} className="text-sm font-black text-sky-700 dark:text-sky-300 sm:text-lg animate-slide-fade">
          {conversions[activeIdx]}
        </p>
      </div>

      <p className="mt-4 text-base font-medium text-slate-600 dark:text-slate-300 sm:text-lg">{t.headerSubtitle}</p>

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
