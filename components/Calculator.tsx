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

const Tooltip: React.FC<{ text: string; children: React.ReactNode; className?: string }> = ({ text, children, className }) => (
  <div className={`group relative ${className}`}>
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-xl bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-slate-900 sm:text-xs">
      {text}
    </div>
  </div>
);

export const Calculator: React.FC<CalculatorProps> = ({ rates, t, onCurrencySelect }) => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IQD');
  const [rotation, setRotation] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);

  const currencies = useMemo(
    () => [
      { code: 'USD', name: t.usd },
      { code: 'IQD', name: t.iqd },
      { code: 'EUR', name: t.eur },
      { code: 'TRY', name: t.try },
      { code: 'GBP', name: t.gbp },
      { code: 'IRT', name: t.irt },
    ],
    [t],
  );

  const currencyTooltips: { [key: string]: keyof Translation } = useMemo(
    () => ({
      USD: 'usdTooltip',
      IQD: 'iqdTooltip',
      EUR: 'eurTooltip',
      TRY: 'tryTooltip',
      GBP: 'gbpTooltip',
      IRT: 'irtTooltip',
    }),
    [],
  );

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
    setRotation((prev) => prev + 180);
    setIsSwapping(true);
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
    setTimeout(() => setIsSwapping(false), 300);
  };

  const selectorBaseClass =
    'w-full appearance-none rounded-2xl border px-4 py-3 text-sm font-black text-slate-900 shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white sm:text-base';
  const selectorStateClass = isSwapping
    ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-200 dark:border-sky-500/30 dark:bg-sky-500/10 dark:ring-sky-500/20'
    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700';

  return (
    <div className="flex w-full max-w-full flex-col gap-5 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:gap-6 sm:p-6">
      <div className="relative">
        <label htmlFor="amount" className="mb-2 block text-xs font-black text-slate-500 dark:text-slate-400">
          {t.amount}
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t.amountPlaceholder}
          className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-xl font-black text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 sm:px-5 sm:text-3xl"
          dir="ltr"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400">{t.from}</label>
          <Tooltip text={t[currencyTooltips[fromCurrency]]} className="w-full">
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className={`${selectorBaseClass} ${selectorStateClass}`}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>

        <div className="flex items-center justify-center sm:pb-1">
          <button
            onClick={handleSwap}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-md transition-all hover:-translate-y-0.5 hover:bg-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
            aria-label="Swap currencies"
          >
            <SwapIcon className="h-6 w-6 transition-transform duration-500 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }} />
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400">{t.to}</label>
          <Tooltip text={t[currencyTooltips[toCurrency]]} className="w-full">
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className={`${selectorBaseClass} ${selectorStateClass}`}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>
      </div>

      <Tooltip text={t.resultTooltip} className="w-full">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 text-center shadow-sm dark:border-emerald-500/15 dark:bg-slate-900 sm:p-6">
          <div className="relative">
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{t.result}</p>
            <p className="mt-3 break-words font-mono text-3xl font-black leading-tight text-emerald-950 dark:text-emerald-100 sm:text-5xl" dir="ltr">
              {calculatedResult}
            </p>

            {directRate > 0 && fromCurrency !== toCurrency && (
              <div className="mt-5 flex flex-col items-center gap-3">
                <div className="max-w-full rounded-full border border-emerald-200 bg-white px-4 py-2 dark:border-emerald-500/15 dark:bg-slate-950">
                  <p className="truncate text-xs font-mono font-black text-emerald-800 dark:text-emerald-200" dir="ltr">
                    1{' '}
                    <button
                      onClick={() => onCurrencySelect(fromCurrency)}
                      className="font-black hover:underline focus:outline-none focus:text-emerald-900 dark:focus:text-emerald-100"
                    >
                      {fromCurrency}
                    </button>{' '}
                    ≈ {directRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
                    <button
                      onClick={() => onCurrencySelect(toCurrency)}
                      className="font-black hover:underline focus:outline-none focus:text-emerald-900 dark:focus:text-emerald-100"
                    >
                      {toCurrency}
                    </button>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t.liveRate}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    </div>
  );
};
