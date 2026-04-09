import React from 'react';
import type { Translation } from '../types';

interface ComparisonRatesProps {
  iqdRate?: number;
  eurRate?: number;
  tryRate?: number;
  gbpRate?: number;
  irtRate?: number;
  t: Translation;
  onCurrencySelect: (currencyCode: string) => void;
}

const ComparisonItem: React.FC<{ label: string; value: string; description?: string; currency: string; onClick: () => void }> = ({
  label,
  value,
  description,
  currency,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="group w-full rounded-[1.5rem] border border-emerald-200/70 bg-white/80 p-4 text-center shadow-[0_20px_40px_-28px_rgba(16,185,129,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50 dark:border-emerald-500/15 dark:bg-white/5 dark:hover:bg-emerald-500/10"
  >
    <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">{label}</p>
    <p className="mt-3 font-mono text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
      {value} <span className="text-[11px] font-semibold opacity-70">{currency}</span>
    </p>
    {description && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
  </button>
);

export const ComparisonRates: React.FC<ComparisonRatesProps> = ({ iqdRate, eurRate, tryRate, gbpRate, irtRate, t, onCurrencySelect }) => {
  if (!iqdRate || (!eurRate && !tryRate && !gbpRate && !irtRate)) {
    return null;
  }

  const iqdPerEur = eurRate ? (iqdRate / eurRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
  const iqdPerTry = tryRate ? (iqdRate / tryRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
  const iqdPerGbp = gbpRate ? (iqdRate / gbpRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
  const iqdPerIrt = irtRate ? (iqdRate / irtRate).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '---';

  return (
    <div className="rounded-[1.8rem] border border-emerald-200/70 bg-[linear-gradient(145deg,rgba(236,253,245,0.92),rgba(255,255,255,0.82))] p-5 shadow-[0_30px_80px_-42px_rgba(16,185,129,0.38)] backdrop-blur-xl dark:border-emerald-500/15 dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(15,23,42,0.88))] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase text-emerald-600/80 dark:text-emerald-300/80">DinarLive</p>
          <h3 className="mt-1 text-lg font-black text-emerald-950 dark:text-emerald-100 sm:text-xl">{t.comparisonRatesTitle}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {eurRate > 0 && <ComparisonItem label={t.eurToIqd} value={iqdPerEur} description={t.eurRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('EUR')} />}
        {tryRate > 0 && <ComparisonItem label={t.tryToIqd} value={iqdPerTry} description={t.tryRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('TRY')} />}
        {gbpRate > 0 && <ComparisonItem label={t.gbpToIqd} value={iqdPerGbp} description={t.gbpRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('GBP')} />}
        {irtRate > 0 && <ComparisonItem label={t.irtToIqd} value={iqdPerIrt} description={t.irtRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('IRT')} />}
      </div>
    </div>
  );
};
