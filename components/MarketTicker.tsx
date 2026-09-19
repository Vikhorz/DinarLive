import React from 'react';

interface MarketTickerProps {
  items: string[];
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ items }) => {
  if (items.length === 0) return null;

  const renderItems = (keyPrefix: string) =>
    items.map((item, index) => (
      <React.Fragment key={`${keyPrefix}-${index}`}>
        <bdi dir="ltr" className="shrink-0 whitespace-nowrap px-1 text-xs font-bold tracking-wide sm:text-sm">
          {item}
        </bdi>
        <span
          className="theme-surface-card theme-text-primary theme-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-black shadow-sm sm:h-8 sm:w-8 sm:text-[10px]"
          aria-hidden="true"
        >
          د.ع
        </span>
      </React.Fragment>
    ));

  return (
    <div
      className="theme-surface-inverted theme-border-strong overflow-hidden rounded-lg border shadow-sm"
      dir="ltr"
      aria-label="Live market prices"
    >
      <div className="ticker-track flex w-max items-center gap-7 py-2.5 sm:gap-10" style={{ animationDuration: `${Math.max(items.length * 4, 20)}s` }}>
        <div className="flex shrink-0 items-center gap-7 sm:gap-10">{renderItems('first')}</div>
        <div className="flex shrink-0 items-center gap-7 sm:gap-10" aria-hidden="true">{renderItems('second')}</div>
      </div>
    </div>
  );
};
