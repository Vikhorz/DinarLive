import React, { useState, useMemo } from 'react';
import { Dialog } from './Dialog';
import { currencyData } from '../currencyData';
import type { Translation } from '../types';

interface BuyCurrencyModalProps {
  currencyCode: string;
  rates: { [key: string]: number };
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
}

export const BuyCurrencyModal: React.FC<BuyCurrencyModalProps> = ({ currencyCode, rates, isOpen, onClose, t }) => {
    const [amount, setAmount] = useState('');
    const data = currencyData[currencyCode];

    const costInIqd = useMemo(() => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return 0;
    
        const rateVsUsd = rates[currencyCode];
        const iqdPerUsd = rates['IQD'];
        if (!rateVsUsd || !iqdPerUsd) return 0;
        
        if (currencyCode === 'IQD') {
            return numericAmount;
        }

        const cost = (numericAmount / rateVsUsd) * iqdPerUsd;
        return cost;
    
      }, [amount, currencyCode, rates]);

      if (!isOpen || !data) return null;

      return (
        <Dialog isOpen={isOpen} onClose={onClose} title={t.buyCurrencyTitle(data.name(t))} t={t}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="buy-amount" className="theme-text-primary mb-1 block text-left text-sm font-medium rtl:text-right">{t.purchaseAmount} ({currencyCode})</label>
                    <input
                        id="buy-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="theme-surface-muted theme-border theme-text-primary theme-focus font-data w-full rounded-lg border p-2 text-left text-lg outline-none transition-colors duration-300"
                        dir="ltr"
                        autoFocus
                    />
                </div>
                <div className="theme-surface-muted theme-border rounded-lg border p-3 text-center">
                    <p className="theme-text-primary text-sm">{t.costInIqd}</p>
                    <p className="theme-text-primary font-data text-xl font-bold" dir="ltr">
                        {costInIqd > 0 ? costInIqd.toLocaleString('en-US', {maximumFractionDigits: 0}) : '0'}
                        {' '}
                        <span className="text-sm">{t.iqd}</span>
                    </p>
                </div>
            </div>
        </Dialog>
      );
};
