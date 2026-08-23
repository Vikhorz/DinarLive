import React from 'react';
import type { GoldData, MetalsData, Translation } from '../types';

interface MetalsCardProps {
  metals: MetalsData;
  iqdPerUsd: number;
  t: Translation;
  gold?: GoldData;
  onOpenGold?: () => void;
}

const MetalItem: React.FC<{
  label: string;
  usdValue: number | null;
  dateIso: string | null;
  iqdPerUsd: number;
  iqdLabel: string;
  pendingLabel: string;
  asOfLabel: string;
}> = ({ label, usdValue, dateIso, iqdPerUsd, iqdLabel, pendingLabel, asOfLabel }) => (
  <div className="theme-surface-muted theme-border theme-lift rounded-lg border p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1">
    <p className="theme-text-secondary text-xs font-black uppercase">{label}</p>
    {usdValue !== null ? (
      <>
        <p className="theme-text-primary font-data mt-3 text-2xl font-black" dir="ltr">
          ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </p>
        <p className="theme-text-secondary mt-2 text-xs" dir="ltr">
          {iqdLabel}: {Math.round(usdValue * iqdPerUsd).toLocaleString()}
        </p>
        {dateIso && (
          <p className="theme-text-secondary mt-1 text-[11px] opacity-70" dir="ltr">
            {asOfLabel} {new Date(dateIso).toLocaleDateString('en-GB')}
          </p>
        )}
      </>
    ) : (
      <p className="theme-text-secondary mt-3 text-sm italic">{pendingLabel}</p>
    )}
  </div>
);

export const MetalsCard: React.FC<MetalsCardProps> = ({ metals, iqdPerUsd, t, gold, onOpenGold }) => {
  return (
    <div className="theme-surface-card theme-border theme-shadow-soft rounded-lg border p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="theme-text-secondary font-data text-[11px] font-black uppercase">DinarLive</p>
      </div>

      {gold && (
        <button
          onClick={onOpenGold}
          className="theme-surface-inverted theme-border-strong theme-lift theme-focus mb-5 w-full rounded-lg border p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-0.5 focus:outline-none sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black sm:text-xl">
              {t.goldTitle} · {t.goldKaratWord} 21
            </h3>
            <span className="rounded-full border px-3 py-1 text-xs font-black">{t.goldSellPriceLabel}</span>
          </div>

          {gold.karat21 !== null ? (
            <p className="font-data mt-4 text-3xl font-black sm:text-4xl" dir="ltr">
              {gold.karat21.toLocaleString()} <span className="text-lg font-bold sm:text-xl">{t.iqdCurrency}</span>
            </p>
          ) : (
            <p className="mt-4 text-sm italic opacity-80">{t.goldPendingLabel}</p>
          )}

          <p className="mt-3 text-xs font-semibold opacity-80">
            {t.goldPerMithqal} · {t.goldTapHint}
          </p>
        </button>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="theme-text-primary text-lg font-black sm:text-xl">{t.metalsTitle}</h3>
        <p className="theme-text-secondary text-xs font-semibold">{t.metalsPriceUnit}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetalItem label={t.dubaiLiraLabel} usdValue={metals.dubaiLira} dateIso={metals.dubaiLiraDate} iqdPerUsd={iqdPerUsd} iqdLabel={t.metalsIqdLabel} pendingLabel={t.metalsPendingLabel} asOfLabel={t.metalsAsOfLabel} />
        <MetalItem label={t.palmSilverLabel} usdValue={metals.palmSilver} dateIso={metals.palmSilverDate} iqdPerUsd={iqdPerUsd} iqdLabel={t.metalsIqdLabel} pendingLabel={t.metalsPendingLabel} asOfLabel={t.metalsAsOfLabel} />
        <MetalItem label={t.copper9999Label} usdValue={metals.copper9999} dateIso={metals.copper9999Date} iqdPerUsd={iqdPerUsd} iqdLabel={t.metalsIqdLabel} pendingLabel={t.metalsPendingLabel} asOfLabel={t.metalsAsOfLabel} />
      </div>
    </div>
  );
};
