import React from 'react';
import { Dialog } from './Dialog';
import type { GoldData, Translation } from '../types';

interface GoldModalProps {
  gold: GoldData;
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
}

const KaratRow: React.FC<{ karat: number; value: number | null; t: Translation }> = ({ karat, value, t }) => (
  <div className="theme-border flex items-center justify-between border-b py-3 last:border-b-0">
    <span className="theme-text-primary font-bold">
      {t.goldKaratWord} {karat}
    </span>
    {value !== null ? (
      <span className="theme-text-primary font-data font-black" dir="ltr">
        {value.toLocaleString()} {t.iqdCurrency}
      </span>
    ) : (
      <span className="theme-text-secondary text-sm italic">{t.goldPendingLabel}</span>
    )}
  </div>
);

export const GoldModal: React.FC<GoldModalProps> = ({ gold, isOpen, onClose, t }) => {
  if (!isOpen) return null;

  const karats: [number, number | null][] = [
    [22, gold.karat22],
    [21, gold.karat21],
    [18, gold.karat18],
    [14, gold.karat14],
    [12, gold.karat12],
    [9, gold.karat9],
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.goldTitle} t={t}>
      <div className="text-start">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="theme-surface-muted theme-border rounded-full border px-3 py-1 text-xs font-black">
            {t.goldSellPriceLabel}
          </span>
          {gold.date && (
            <span className="theme-text-secondary text-xs font-semibold" dir="ltr">
              {t.goldAsOfLabel} {gold.date}
            </span>
          )}
        </div>

        <div className="theme-surface-muted theme-border rounded-lg border px-4">
          {karats.map(([karat, value]) => (
            <KaratRow key={karat} karat={karat} value={value} t={t} />
          ))}
        </div>

        <div className="theme-surface-muted theme-border mt-3 flex items-center justify-between rounded-lg border px-4 py-3">
          <span className="theme-text-primary font-bold">{t.goldOunceLabel}</span>
          {gold.ounceUsd !== null ? (
            <span className="theme-text-primary font-data font-black" dir="ltr">
              ${gold.ounceUsd.toLocaleString()}
            </span>
          ) : (
            <span className="theme-text-secondary text-sm italic">{t.goldPendingLabel}</span>
          )}
        </div>

        <p className="theme-text-secondary mt-5 text-center text-xs leading-6">{t.goldPricingNote}</p>
      </div>
    </Dialog>
  );
};
