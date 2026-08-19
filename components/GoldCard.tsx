import React from 'react';
import type { GoldData, Translation } from '../types';

interface GoldCardProps {
  gold: GoldData;
  t: Translation;
  onOpen: () => void;
}

export const GoldCard: React.FC<GoldCardProps> = ({ gold, t, onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="theme-surface-card theme-border theme-shadow-soft theme-lift theme-focus w-full rounded-lg border p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-0.5 focus:outline-none sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="theme-text-secondary font-data text-[11px] font-black uppercase">DinarLive</p>
          <h3 className="theme-text-primary mt-1 text-lg font-black sm:text-xl">
            {t.goldTitle} · {t.goldKaratWord} 21
          </h3>
        </div>
        <span className="theme-surface-muted theme-border rounded-full border px-3 py-1 text-xs font-black">
          {t.goldSellPriceLabel}
        </span>
      </div>

      {gold.karat21 !== null ? (
        <p className="theme-text-primary font-data mt-4 text-3xl font-black sm:text-4xl" dir="ltr">
          {gold.karat21.toLocaleString()} <span className="text-lg font-bold sm:text-xl">{t.iqdCurrency}</span>
        </p>
      ) : (
        <p className="theme-text-secondary mt-4 text-sm italic">{t.goldPendingLabel}</p>
      )}

      <p className="theme-text-secondary mt-3 text-xs font-semibold">{t.goldPerMithqal} · {t.goldTapHint}</p>
    </button>
  );
};
