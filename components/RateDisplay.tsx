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

    setIconHighlightClass('theme-surface-inverted scale-110');
    const iconTimer = setTimeout(() => setIconHighlightClass(''), 500);

    setRateChangeClass('rate-flash');
    const rateTimer = setTimeout(() => setRateChangeClass(''), 600);

    prevValueRef.current = value;
    return () => {
      clearTimeout(iconTimer);
      clearTimeout(rateTimer);
    };
  }, [value]);

  const shellClass = isHero
    ? 'theme-surface-card theme-border'
    : 'theme-surface-card theme-border';

  const iconClasses = iconHighlightClass || (isHero
    ? 'theme-surface-muted theme-text-primary'
    : 'theme-surface-muted theme-text-primary');

  return (
    <div className={`theme-shadow-soft theme-lift relative overflow-hidden rounded-lg border p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-6 ${shellClass}`}>
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`theme-border flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${iconClasses}`}>
              <DollarIcon />
            </div>

            <div>
              <p className={`theme-text-primary font-black leading-tight ${isHero ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>{label}</p>
              <p className="theme-text-secondary mt-1.5 text-xs leading-5 sm:text-sm">{description}</p>
            </div>
          </div>

          {isHero && trend && (
            <div
              className={`theme-border inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-black transition-colors duration-300 ${
                trend.direction === 'up'
                  ? 'theme-surface-inverted theme-border-strong'
                  : trend.direction === 'down'
                    ? 'theme-surface-muted theme-text-primary border-dashed'
                    : 'theme-surface-muted theme-text-secondary'
              }`}
            >
              <TrendIcon direction={trend.direction} />
              <span dir="ltr">{trend.percentage}%</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`theme-text-primary font-data relative font-black tracking-tight transition-colors duration-300 ${isHero ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} ${rateChangeClass}`} dir="ltr">
              {Math.floor(value).toLocaleString()}
              {loading && (
                <span className="absolute -right-4 top-1 h-3 w-3">
                  <span className="theme-live-dot relative inline-flex h-3 w-3 rounded-full" />
                </span>
              )}
            </p>
            <p className="theme-text-secondary mt-2 text-sm font-bold">{currency}</p>
          </div>

          {isHero && highLow && (
            <div className="grid grid-cols-2 gap-3 sm:min-w-[180px]">
              <div className="theme-surface-muted theme-border rounded-2xl border p-3 text-center">
                <p className="theme-text-secondary text-[11px] font-bold uppercase">H</p>
                <p className="theme-text-primary font-data mt-1 text-sm font-black" dir="ltr">{highLow.high.toLocaleString()}</p>
              </div>
              <div className="theme-surface-muted theme-border rounded-2xl border p-3 text-center">
                <p className="theme-text-secondary text-[11px] font-bold uppercase">L</p>
                <p className="theme-text-primary font-data mt-1 text-sm font-black" dir="ltr">{highLow.low.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {cities && cityLabels && (
          <div className="theme-border mt-6 border-t pt-4">
            <p className="theme-text-secondary mb-3 text-[11px] font-black">{cityLabels.regional}</p>
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
                      ? 'theme-surface-inverted theme-border-strong'
                      : 'theme-surface-muted theme-border'
                  }`}
                >
                  <p className={`text-xs font-black ${city.isBase ? '' : 'theme-text-secondary'}`}>{city.label}</p>
                  <p className={`font-data mt-2 text-lg font-black ${city.isBase ? '' : 'theme-text-primary'}`} dir="ltr">
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
