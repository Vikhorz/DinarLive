import React from 'react';
import type { MetalsData, Translation } from '../types';

interface MetalsCardProps {
  metals: MetalsData;
  iqdPerUsd: number;
  t: Translation;
}

const MetalItem: React.FC<{ label: string; usdValue: number; iqdValue: number; iqdLabel: string }> = ({
  label,
  usdValue,
  iqdValue,
  iqdLabel,
}) => (
  <div className="theme-surface-muted theme-border theme-lift rounded-lg border p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1">
    <p className="theme-text-secondary text-xs font-black uppercase">{label}</p>
    <p className="theme-text-primary font-data mt-3 text-2xl font-black" dir="ltr">
      ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
    </p>
    <p className="theme-text-secondary mt-2 text-xs" dir="ltr">
      {iqdLabel}: {Math.round(iqdValue).toLocaleString()}
    </p>
  </div>
);

export const MetalsCard: React.FC<MetalsCardProps> = ({ metals, iqdPerUsd, t }) => {
  return (
    <div className="theme-surface-card theme-border theme-shadow-soft rounded-lg border p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="theme-text-secondary font-data text-[11px] font-black uppercase">DinarLive</p>
          <h3 className="theme-text-primary mt-1 text-lg font-black sm:text-xl">{t.metalsTitle}</h3>
        </div>
        <p className="theme-text-secondary text-xs font-semibold">{t.metalsPriceUnit}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetalItem label={t.dubaiLiraLabel} usdValue={metals.dubaiLira} iqdValue={metals.dubaiLira * iqdPerUsd} iqdLabel={t.metalsIqdLabel} />
        <MetalItem label={t.palmSilverLabel} usdValue={metals.palmSilver} iqdValue={metals.palmSilver * iqdPerUsd} iqdLabel={t.metalsIqdLabel} />
        <MetalItem label={t.copper9999Label} usdValue={metals.copper9999} iqdValue={metals.copper9999 * iqdPerUsd} iqdLabel={t.metalsIqdLabel} />
      </div>
    </div>
  );
};
