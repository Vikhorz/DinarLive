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
    className="theme-tone-emerald group w-full rounded-[1.5rem] border p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1"
  >
    <p className="theme-tone-emerald-text text-xs font-black uppercase">{label}</p>
    <p className="theme-text-primary mt-3 font-mono text-2xl font-black" dir="ltr">
      {value} <span className="text-[11px] font-semibold opacity-70">{currency}</span>
    </p>
    {description && <p className="theme-text-secondary mt-2 text-xs">{description}</p>}
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
    <div className="theme-surface-card theme-border rounded-[1.8rem] border p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="theme-tone-emerald-text text-[11px] font-black uppercase">DinarLive</p>
          <h3 className="theme-text-primary mt-1 text-lg font-black sm:text-xl">{t.comparisonRatesTitle}</h3>
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
