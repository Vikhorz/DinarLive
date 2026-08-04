import React, { useState, useMemo } from 'react';
import type { Translation } from '../types';

interface CalculatorProps {
  rates: {
    [key: string]: number;
  };
  t: Translation;
  onCurrencySelect: (currencyCode: string) => void;
}

const MAX_INTEGER_DIGITS = 12;
const MAX_DECIMAL_DIGITS = 4;
const MAX_SAFE_AMOUNT = 999999999999.9999;

const normalizeNumericInput = (value: string) =>
  value
    .replace(/[٠-٩]/g, (char) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(char)))
    .replace(/[۰-۹]/g, (char) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(char)));

const sanitizeAmountInput = (rawValue: string) => {
  const normalized = normalizeNumericInput(rawValue).replace(/,/g, '').trim();
  const digitsAndDotOnly = normalized.replace(/[^\d.]/g, '');
  const firstDotIndex = digitsAndDotOnly.indexOf('.');
  const collapsed =
    firstDotIndex === -1
      ? digitsAndDotOnly
      : `${digitsAndDotOnly.slice(0, firstDotIndex + 1)}${digitsAndDotOnly.slice(firstDotIndex + 1).replace(/\./g, '')}`;

  const [integerPartRaw = '', decimalPartRaw = ''] = collapsed.split('.');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS);
  const decimalPart = decimalPartRaw.slice(0, MAX_DECIMAL_DIGITS);
  const candidate = collapsed.includes('.') ? `${integerPart || '0'}.${decimalPart}` : integerPart;

  if (!candidate) {
    return '';
  }

  const numericValue = Number(candidate);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  if (numericValue > MAX_SAFE_AMOUNT) {
    return MAX_SAFE_AMOUNT.toFixed(MAX_DECIMAL_DIGITS).replace(/\.?0+$/, '');
  }

  if (collapsed.endsWith('.') && !decimalPartRaw) {
    return `${integerPart || '0'}.`;
  }

  return candidate;
};

const SwapIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const Tooltip: React.FC<{ text: string; children: React.ReactNode; className?: string }> = ({ text, children, className }) => (
  <div className={`group relative ${className}`}>
    {children}
    <div className="theme-tooltip pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-xl border px-2.5 py-1 text-[10px] font-semibold opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:text-xs">
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

  const handleAmountChange = (value: string) => {
    setAmount(sanitizeAmountInput(value));
  };

  const handleAmountKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  };

  const handleAmountPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    handleAmountChange(pastedText);
  };

  const selectorBaseClass =
    'theme-surface-muted theme-border theme-text-primary theme-focus w-full appearance-none rounded-lg border px-4 py-3 text-sm font-black shadow-sm transition-all duration-300 sm:text-base';
  const selectorStateClass = isSwapping
    ? 'theme-border-strong'
    : 'hover:opacity-80';

  return (
    <div className="theme-surface-card theme-border theme-shadow-soft flex w-full max-w-full flex-col gap-5 overflow-hidden rounded-lg border p-5 shadow-sm sm:gap-6 sm:p-6">
      <div className="relative">
        <label htmlFor="amount" className="theme-text-secondary mb-2 block text-xs font-black">
          {t.amount}
        </label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onKeyDown={handleAmountKeyDown}
          onPaste={handleAmountPaste}
          placeholder={t.amountPlaceholder}
          autoComplete="off"
          className="theme-surface-muted theme-border theme-text-primary theme-focus font-data w-full rounded-lg border px-4 py-4 text-xl font-black shadow-sm outline-none transition-all placeholder:opacity-50 sm:px-5 sm:text-3xl"
          dir="ltr"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <div className="flex min-w-0 flex-col gap-2">
          <label className="theme-text-secondary text-xs font-black">{t.from}</label>
          <Tooltip text={t[currencyTooltips[fromCurrency]]} className="w-full">
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className={`${selectorBaseClass} ${selectorStateClass}`}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} className="theme-surface-card theme-text-primary">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>

        <div className="flex items-center justify-center sm:pb-1">
          <button
            onClick={handleSwap}
            className="theme-surface-inverted theme-border-strong flex h-12 w-12 items-center justify-center rounded-lg border shadow-md transition-all hover:-translate-y-0.5 hover:rotate-180"
            aria-label="Swap currencies"
          >
            <SwapIcon className="h-6 w-6 transition-transform duration-500 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }} />
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="theme-text-secondary text-xs font-black">{t.to}</label>
          <Tooltip text={t[currencyTooltips[toCurrency]]} className="w-full">
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className={`${selectorBaseClass} ${selectorStateClass}`}>
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} className="theme-surface-card theme-text-primary">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>
      </div>

      <Tooltip text={t.resultTooltip} className="w-full">
        <div className="theme-surface-muted theme-border relative overflow-hidden rounded-lg border p-5 text-center shadow-sm sm:p-6">
          <div className="relative">
            <p className="theme-text-secondary text-xs font-black">{t.result}</p>
            <p className="theme-text-primary font-data mt-3 break-words text-3xl font-black leading-tight sm:text-5xl" dir="ltr">
              {calculatedResult}
            </p>

            {directRate > 0 && fromCurrency !== toCurrency && (
              <div className="mt-5 flex flex-col items-center gap-3">
                <div className="theme-surface-card theme-border max-w-full rounded-lg border px-4 py-2">
                  <p className="theme-text-primary font-data truncate text-xs font-black" dir="ltr">
                    1{' '}
                    <button
                      onClick={() => onCurrencySelect(fromCurrency)}
                      className="font-black hover:underline focus:outline-none theme-focus rounded"
                    >
                      {fromCurrency}
                    </button>{' '}
                    ≈ {directRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
                    <button
                      onClick={() => onCurrencySelect(toCurrency)}
                      className="font-black hover:underline focus:outline-none theme-focus rounded"
                    >
                      {toCurrency}
                    </button>
                  </p>
                </div>

                <div className="theme-text-secondary flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="theme-live-dot h-1.5 w-1.5 rounded-full" />
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
