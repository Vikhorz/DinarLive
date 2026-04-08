
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
        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1.0 01-1.414 0z" clipRule="evenodd" />
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
  return <span className="text-xl font-bold leading-none">-</span>;
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

    setIconHighlightClass('bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 scale-110');
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

  const bgColor = isHero 
    ? 'bg-gradient-to-br from-amber-50/40 via-white to-gray-50 dark:from-amber-900/10 dark:via-gray-800 dark:to-gray-900 border border-amber-100 dark:border-amber-900/30 shadow-xl' 
    : 'bg-gradient-to-br from-sky-50/40 via-white to-gray-50 dark:from-sky-900/10 dark:via-gray-800 dark:to-gray-900 border border-sky-100 dark:border-sky-900/30 shadow-lg';
  
  const iconClasses = iconHighlightClass || (isHero 
    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' 
    : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400');

  return (
    <div className={`p-5 md:p-6 rounded-2xl ${bgColor} transition-all duration-300 relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
           <div className={`p-3 rounded-2xl border border-white/20 transition-all duration-500 ${iconClasses}`}>
              <DollarIcon />
           </div>
          <div>
            <p className={`font-bold ${isHero ? 'text-lg md:text-xl text-gray-800 dark:text-white' : 'text-base text-gray-700 dark:text-gray-200'}`}>{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {isHero && trend && (
           <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-opacity-10 dark:bg-opacity-20 ${trend.direction === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : trend.direction === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-600'}`}>
              <TrendIcon direction={trend.direction} />
              <span dir="ltr">{trend.percentage}%</span>
           </div>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
         <div>
            <p className={`${isHero ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'} font-extrabold tracking-tight relative transition-colors duration-300 ${rateChangeClass || 'text-gray-900 dark:text-white'}`} dir="ltr">
                {Math.floor(value).toLocaleString()}
                {loading && (
                <span className="absolute -top-1 -right-4 h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
                )}
            </p>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1">{currency}</p>
         </div>
         
         {isHero && highLow && (
             <div className="text-right flex flex-col gap-1">
                 <div className="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>H:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{highLow.high.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>L:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{highLow.low.toLocaleString()}</span>
                 </div>
             </div>
         )}
      </div>

      {cities && cityLabels && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-3">
            {cityLabels.regional}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'suly', label: cityLabels.suly, val: cities.sulaymaniyah, isBase: true },
              { id: 'erbil', label: cityLabels.erbil, val: cities.erbil, isBase: false },
              { id: 'duhok', label: cityLabels.duhok, val: cities.duhok, isBase: false }
            ].map(city => {
                return (
                    <div key={city.id} className={`p-2.5 rounded-xl border transition-all ${city.isBase ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className={`text-[10px] font-bold truncate ${city.isBase ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}>{city.label}</p>
                        </div>
                        <p className={`text-xs sm:text-sm font-mono font-bold ${city.isBase ? 'text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'}`} dir="ltr">
                            {city.val.toLocaleString()}
                        </p>
                    </div>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
