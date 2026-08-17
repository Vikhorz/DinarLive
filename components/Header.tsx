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
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center xl:mx-0 xl:items-end xl:text-right">
      <h1 className="theme-text-primary max-w-[12.8ch] text-balance text-[2.45rem] font-black leading-[1.55] tracking-[0.01em] sm:max-w-[13.5ch] sm:text-[3.2rem] sm:leading-[1.45] lg:max-w-[14.5ch] lg:text-[4.05rem] lg:leading-[1.38] xl:text-[4.55rem] xl:leading-[1.32]">
        {t.headerTitle}
      </h1>

      <div className="theme-surface-muted theme-border relative mt-7 flex h-12 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border px-5 shadow-sm sm:mt-9 sm:h-14 sm:max-w-xl">
        <p key={activeIdx} className="theme-text-primary animate-slide-fade text-[0.92rem] font-black leading-none sm:text-base lg:text-lg">
          {conversions[activeIdx]}
        </p>
      </div>

      <p className="theme-text-secondary mt-4 text-sm font-semibold leading-7 sm:text-lg">{t.headerSubtitle}</p>

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
