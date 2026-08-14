import React from 'react';

interface MarketTickerProps {
  items: string[];
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ items }) => {
  if (items.length === 0) return null;

  const content = items.join('   •   ');

  return (
    <div
      className="theme-surface-inverted theme-border-strong overflow-hidden rounded-lg border"
      dir="ltr"
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap py-2.5" style={{ animationDuration: `${Math.max(items.length * 4, 20)}s` }}>
        <span className="font-data px-6 text-xs font-bold sm:text-sm">{content}</span>
        <span className="font-data px-6 text-xs font-bold sm:text-sm">{content}</span>
      </div>
    </div>
  );
};
