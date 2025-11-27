import React, { useState, useMemo } from 'react';
import type { Translation } from '../types';

interface CalculatorProps {
  rates: {
    [key: string]: number;
  };
  t: Translation;
  onCurrencySelect: (currencyCode: string) => void;
}

const SwapIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const Tooltip: React.FC<{ text: string; children: React.ReactNode; className?: string }> = ({ text, children, className }) => {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
        {text}
      </div>
    </div>
  );
};

export const Calculator: React.FC<CalculatorProps> = ({ rates, t, onCurrencySelect }) => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IQD');
  const [rotation, setRotation] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);

  const currencies = useMemo(() => [
    { code: 'USD', name: t.usd },
    { code: 'IQD', name: t.iqd },
    { code: 'EUR', name: t.eur },
    { code: 'TRY', name: t.try },
    { code: 'GBP', name: t.gbp },
    { code: 'IRT', name: t.irt },
  ], [t]);

  const currencyTooltips: { [key: string]: keyof Translation } = useMemo(() => ({
    USD: 'usdTooltip',
    IQD: 'iqdTooltip',
    EUR: 'eurTooltip',
    TRY: 'tryTooltip',
    GBP: 'gbpTooltip',
    IRT: 'irtTooltip',
  }), []);

  const directRate = useMemo(() => {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (typeof fromRate !== 'number' || typeof toRate !== 'number' || fromRate <= 0) {
      return 0;
    }
    return toRate / fromRate;
  }, [fromCurrency, toCurrency, rates]);

  const calculatedResult = useMemo(() => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || directRate <= 0) {
      return '0';
    }

    const result = numericAmount * directRate;
    const formatOptions: Intl.NumberFormatOptions = {};
    if (toCurrency === 'IQD' || toCurrency === 'IRT') {
        formatOptions.maximumFractionDigits = 0;
    } else {
        formatOptions.minimumFractionDigits = 2;
        formatOptions.maximumFractionDigits = 2;
    }

    return result.toLocaleString('en-US', formatOptions);
  }, [amount, toCurrency, directRate]);

  const handleSwap = () => {
    setRotation(prev => prev + 180);
    setIsSwapping(true);
    
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);

    setTimeout(() => {
      setIsSwapping(false);
    }, 300);
  };

  const selectorBaseClass = "w-full appearance-none border rounded-xl py-3 px-4 text-center font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300 shadow-sm";
  const selectorStateClass = isSwapping 
    ? "bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 transform scale-105 ring-2 ring-sky-200 dark:ring-sky-800" 
    : "bg-gray-100 dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-white";

  return (
    <div className="flex flex-col gap-6">
      {/* Amount Input Section */}
      <div className="relative">
        <label htmlFor="amount" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t.amount}</label>
        <div className="relative">
           <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t.amountPlaceholder}
            className="w-full p-4 pl-4 pr-12 text-2xl font-bold bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
            dir="ltr"
          />
        </div>
      </div>

      {/* Currency Selection Grid */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        
        {/* FROM Currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t.from}</label>
          <Tooltip text={t[currencyTooltips[fromCurrency]]} className="w-full">
            <div className="relative">
              <select 
                value={fromCurrency} 
                onChange={e => setFromCurrency(e.target.value)} 
                className={`${selectorBaseClass} ${selectorStateClass}`}
              >
                {currencies.map(c => <option key={c.code} value={c.code} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{c.code} - {c.name}</option>)}
              </select>
            </div>
          </Tooltip>
        </div>

        {/* Swap Button (Centered & Prominent) */}
        <div className="flex flex-col justify-end pb-1">
            <button 
                onClick={handleSwap} 
                className="p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 active:bg-sky-300 dark:active:bg-sky-700 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 z-10"
                aria-label="Swap currencies"
            >
                <SwapIcon 
                  className="w-6 h-6 transition-transform duration-500 ease-in-out" 
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
            </button>
        </div>

        {/* TO Currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t.to}</label>
          <Tooltip text={t[currencyTooltips[toCurrency]]} className="w-full">
            <div className="relative">
              <select 
                value={toCurrency} 
                onChange={e => setToCurrency(e.target.value)} 
                className={`${selectorBaseClass} ${selectorStateClass}`}
              >
                {currencies.map(c => <option key={c.code} value={c.code} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">{c.code} - {c.name}</option>)}
              </select>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Result Card */}
      <Tooltip text={t.resultTooltip} className="w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/50 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">{t.result}</p>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono text-green-800 dark:text-green-100 break-words" dir="ltr">
             {calculatedResult}
          </p>
          {directRate > 0 && fromCurrency !== toCurrency && (
              <div className="mt-3 inline-block bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30">
                  <p className="text-xs text-green-700 dark:text-green-300 font-mono" dir="ltr">
                    1{' '}
                    <button 
                        onClick={() => onCurrencySelect(fromCurrency)}
                        className="font-bold hover:underline cursor-pointer focus:outline-none focus:text-green-800 dark:focus:text-green-200"
                    >
                        {fromCurrency}
                    </button>
                    {' '}≈{' '}
                    {directRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    {' '}
                    <button 
                        onClick={() => onCurrencySelect(toCurrency)}
                        className="font-bold hover:underline cursor-pointer focus:outline-none focus:text-green-800 dark:focus:text-green-200"
                    >
                        {toCurrency}
                    </button>
                  </p>
              </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};