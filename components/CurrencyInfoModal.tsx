import React from 'react';
import { Dialog } from './Dialog';
import { currencyData } from '../currencyData';
import type { Translation } from '../types';

interface CurrencyInfoModalProps {
  currencyCode: string;
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  t: Translation;
}

const InfoSection: React.FC<{title: string, content: string}> = ({title, content}) => (
    <div className="mb-4 text-left rtl:text-right">
        <h3 className="theme-text-primary font-bold">{title}</h3>
        <p className="theme-text-primary whitespace-pre-line text-sm leading-7">{content}</p>
    </div>
);

export const CurrencyInfoModal: React.FC<CurrencyInfoModalProps> = ({ currencyCode, isOpen, onClose, onBuy, t }) => {
  const data = currencyData[currencyCode];

  if (!isOpen || !data) return null;

  const footer = (
    <div className="flex items-center gap-3">
        <button onClick={onClose} className="theme-surface-muted theme-border theme-text-primary theme-focus w-full rounded-lg border px-4 py-2 transition-colors focus:outline-none">
            {t.closeButton}
        </button>
        { currencyCode !== 'IQD' && (
            <button onClick={onBuy} className="theme-surface-inverted theme-border-strong theme-focus w-full rounded-lg border px-4 py-2 font-black transition-colors focus:outline-none">
                {t.buyButton(currencyCode)}
            </button>
        )}
    </div>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.currencyInfoTitle(data.name(t))} t={t} footer={footer}>
        <div className="text-center">
            <InfoSection title={t.isoCode} content={data.iso} />
            <InfoSection title={t.commonUses} content={data.description(t)} />
            <InfoSection title={t.funFact} content={data.fact(t)} />
        </div>
    </Dialog>
  );
};
