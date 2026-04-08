
import React from 'react';
import type { Translation } from '../types';

interface ComparisonRatesProps {
    iqdRate?: number;
    eurRate?: number; // vs USD
    tryRate?: number; // vs USD
    gbpRate?: number; // vs USD
    irtRate?: number; // vs USD
    t: Translation;
    onCurrencySelect: (currencyCode: string) => void;
}

const ComparisonItem: React.FC<{label: string, value: string, description?: string, currency: string, onClick: () => void}> = ({ label, value, description, currency, onClick }) => (
    <button 
        onClick={onClick}
        className="p-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-emerald-100/50 dark:border-emerald-800/30 rounded-xl text-center transition-all duration-300 w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:scale-[1.03] active:scale-95 shadow-sm"
    >
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{label}</p>
        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white mt-1" dir="ltr">{value} <span className="text-[10px] font-sans opacity-70">{currency}</span></p>
        {description && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">{description}</p>}
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
        <div className="bg-gradient-to-br from-emerald-50/30 via-white to-gray-50 dark:from-emerald-900/10 dark:via-gray-800 dark:to-gray-900 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-5 shadow-lg animate-fade-in">
            <h3 className="text-center text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest transition-colors duration-300 mb-4">{t.comparisonRatesTitle}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {eurRate > 0 && <ComparisonItem label={t.eurToIqd} value={iqdPerEur} description={t.eurRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('EUR')} />}
               {tryRate > 0 && <ComparisonItem label={t.tryToIqd} value={iqdPerTry} description={t.tryRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('TRY')} />}
               {gbpRate > 0 && <ComparisonItem label={t.gbpToIqd} value={iqdPerGbp} description={t.gbpRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('GBP')} />}
               {irtRate > 0 && <ComparisonItem label={t.irtToIqd} value={iqdPerIrt} description={t.irtRateDescription} currency={t.iqdCurrency} onClick={() => onCurrencySelect('IRT')} />}
            </div>
        </div>
    );
};
