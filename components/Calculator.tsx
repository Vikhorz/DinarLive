
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
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-[10px] sm:text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
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
    setTimeout(() => setIsSwapping(false), 300);
  };

  const selectorBaseClass = "w-full appearance-none border rounded-xl py-2.5 sm:py-3 px-2 sm:px-4 text-center font-bold text-sm sm:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300 shadow-sm";
  const selectorStateClass = isSwapping 
    ? "bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 transform scale-105 ring-2 ring-sky-200 dark:ring-sky-800" 
    : "bg-gray-50 dark:bg-gray-800/40 border-transparent hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-white";

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-full overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-sky-950/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
      {/* Amount Input Section */}
      <div className="relative">
        <label htmlFor="amount" className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t.amount}</label>
        <div className="relative">
           <input
            id="amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t.amountPlaceholder}
            className="w-full p-3 sm:p-4 pl-4 pr-12 text-lg sm:text-2xl font-bold bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
            dir="ltr"
          />
        </div>
      </div>

      {/* Currency Selection Grid */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-4">
        {/* FROM Currency */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">{t.from}</label>
          <Tooltip text={t[currencyTooltips[fromCurrency]]} className="w-full">
            <div className="relative w-full">
              <select 
                value={fromCurrency} 
                onChange={e => setFromCurrency(e.target.value)} 
                className={`${selectorBaseClass} ${selectorStateClass}`}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </Tooltip>
        </div>

        {/* Swap Button */}
        <div className="flex flex-col justify-end pb-0.5 flex-shrink-0">
            <button 
                onClick={handleSwap} 
                className="p-2 sm:p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 active:bg-sky-300 dark:active:bg-sky-700 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 z-10"
                aria-label="Swap currencies"
            >
                <SwapIcon 
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500 ease-in-out" 
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
            </button>
        </div>

        {/* TO Currency */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">{t.to}</label>
          <Tooltip text={t[currencyTooltips[toCurrency]]} className="w-full">
            <div className="relative w-full">
              <select 
                value={toCurrency} 
                onChange={e => setToCurrency(e.target.value)} 
                className={`${selectorBaseClass} ${selectorStateClass}`}
              >
                 {currencies.map(c => (
                  <option key={c.code} value={c.code} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Result Card */}
      <Tooltip text={t.resultTooltip} className="w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/50 rounded-2xl p-5 sm:p-6 text-center shadow-sm w-full overflow-hidden relative">
          <p className="text-[10px] sm:text-sm font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-widest">{t.result}</p>
          <p className="text-2xl sm:text-4xl font-extrabold font-mono text-green-800 dark:text-green-100 break-words leading-tight" dir="ltr">
             {calculatedResult}
          </p>
          
          {directRate > 0 && fromCurrency !== toCurrency && (
              <div className="mt-4 flex flex-col items-center gap-1.5">
                  <div className="inline-block bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30 max-w-full">
                      <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 font-mono truncate" dir="ltr">
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
                  
                  {/* Localized Live Rate Text */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span>{t.liveRate}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
              </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};
