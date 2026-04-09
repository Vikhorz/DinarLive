import React, { useState, useEffect, useRef } from 'react';

interface RateDisplayProps {
  value: number;
  loading: boolean;
  label: string;
  description: string;
  currency: string;
  cities?: {
    sulaymaniyah: number;
    erbil: number;
    duhok: number;
  };
  cityLabels?: {
    suly: string;
    erbil: string;
    duhok: string;
    regional: string;
  };
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: string;
  };
  highLow?: {
    high: number;
    low: number;
  };
  isHero?: boolean;
}

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0 1v.01M12 16c-1.11 0-2.08-.402-2.599-1M12 16H9.401M12 8h2.599M12 8V6m0 12v-2m0-10V4m0 16v-2" />
  </svg>
);

const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'neutral' }> = ({ direction }) => {
  if (direction === 'up') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    );
  }

  if (direction === 'down') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }

  return <span className="text-lg font-black leading-none">-</span>;
};

export const RateDisplay: React.FC<RateDisplayProps> = ({ value, loading, label, description, currency, cities, cityLabels, trend, highLow, isHero = false }) => {
  const [iconHighlightClass, setIconHighlightClass] = useState('');
  const [rateChangeClass, setRateChangeClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current === value || value === 0) {
      prevValueRef.current = value;
      return;
    }

    setIconHighlightClass('scale-110 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300');
    const iconTimer = setTimeout(() => setIconHighlightClass(''), 500);

    if (value > prevValueRef.current) setRateChangeClass('text-green-600 dark:text-green-400');
    else if (value < prevValueRef.current) setRateChangeClass('text-red-600 dark:text-red-400');

    const rateTimer = setTimeout(() => setRateChangeClass(''), 500);

    prevValueRef.current = value;
    return () => {
      clearTimeout(iconTimer);
      clearTimeout(rateTimer);
    };
  }, [value]);

  const shellClass = isHero
    ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-slate-900'
    : 'border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-slate-900';

  const iconClasses = iconHighlightClass || (isHero
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300');

  return (
    <div className={`relative overflow-hidden rounded-[1.8rem] border p-5 shadow-sm transition-all duration-300 sm:p-6 ${shellClass}`}>
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.2rem] border border-white/50 transition-all duration-500 ${iconClasses}`}>
              <DollarIcon />
            </div>

            <div>
              <p className={`font-black text-slate-900 dark:text-white ${isHero ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>{label}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
            </div>
          </div>

          {isHero && trend && (
            <div
              className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-black ${
                trend.direction === 'up'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                  : trend.direction === 'down'
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <TrendIcon direction={trend.direction} />
              <span dir="ltr">{trend.percentage}%</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`relative font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white ${isHero ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} ${rateChangeClass}`} dir="ltr">
              {Math.floor(value).toLocaleString()}
              {loading && (
                <span className="absolute -right-4 top-1 h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
                </span>
              )}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">{currency}</p>
          </div>

          {isHero && highLow && (
            <div className="grid grid-cols-2 gap-3 sm:min-w-[180px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">H</p>
                <p className="mt-1 font-mono text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{highLow.high.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">L</p>
                <p className="mt-1 font-mono text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{highLow.low.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {cities && cityLabels && (
          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="mb-3 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">{cityLabels.regional}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { id: 'suly', label: cityLabels.suly, val: cities.sulaymaniyah, isBase: true },
                { id: 'erbil', label: cityLabels.erbil, val: cities.erbil, isBase: false },
                { id: 'duhok', label: cityLabels.duhok, val: cities.duhok, isBase: false },
              ].map((city) => (
                <div
                  key={city.id}
                  className={`rounded-2xl border p-3 transition-all ${
                    city.isBase
                      ? 'border-amber-200 bg-white dark:border-amber-500/20 dark:bg-slate-950'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                  }`}
                >
                  <p className={`text-xs font-black ${city.isBase ? 'text-amber-800 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>{city.label}</p>
                  <p className={`mt-2 font-mono text-lg font-black ${city.isBase ? 'text-amber-950 dark:text-amber-100' : 'text-slate-900 dark:text-white'}`} dir="ltr">
                    {city.val.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
