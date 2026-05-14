import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RateHistoryEntry, Translation } from '../types';

interface RateHistoryChartProps {
  history: RateHistoryEntry[];
  t: Translation;
}

type ChartPoint = {
  x: number;
  y: number;
  date: Date;
  rate: number;
};

const CHART_HEIGHT = 280;

const getCssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const RateHistoryChart: React.FC<RateHistoryChartProps> = ({ history, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; rate: number } | null>(null);
  const pointsRef = useRef<ChartPoint[]>([]);

  const processedData = useMemo(() => {
    if (!history || history.length < 2) return null;

    return history
      .map((entry) => ({ ...entry, date: new Date(entry.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history]);

  const stats = useMemo(() => {
    if (!processedData) return null;

    const rates = processedData.map((entry) => entry.rate);
    const total = rates.reduce((sum, value) => sum + value, 0);

    return {
      high: Math.max(...rates),
      low: Math.min(...rates),
      avg: Math.round(total / rates.length),
    };
  }, [processedData]);

  useEffect(() => {
    if (!processedData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(320, rect.width);
      const height = CHART_HEIGHT;
      const padding = { top: 30, right: 24, bottom: 38, left: 62 };
      const rates = processedData.map((entry) => entry.rate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      const rangePadding = (max - min) * 0.12 || 100;
      const minRate = min - rangePadding;
      const maxRate = max + rangePadding;
      const range = maxRate - minRate || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const text = getCssVar('--surface-text');
      const muted = getCssVar('--surface-text-muted');
      const grid = getCssVar('--chart-grid');
      const surface = getCssVar('--surface-muted');
      const fillStart = getCssVar('--chart-fill-start');
      const fillEnd = getCssVar('--chart-fill-end');

      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = grid;
      ctx.fillStyle = muted;
      ctx.font = '700 11px "JetBrains Mono"';

      for (let index = 0; index <= 4; index += 1) {
        const y = padding.top + ((height - padding.top - padding.bottom) / 4) * index;
        const label = Math.round(maxRate - (range / 4) * index);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(label.toLocaleString(), 8, y + 4);
      }

      const chartPoints = processedData.map((entry, index) => {
        const x = padding.left + ((width - padding.left - padding.right) / (processedData.length - 1)) * index;
        const y = padding.top + (1 - (entry.rate - minRate) / range) * (height - padding.top - padding.bottom);
        return { x, y, date: entry.date, rate: entry.rate };
      });
      pointsRef.current = chartPoints;

      const path = new Path2D();
      chartPoints.forEach((point, index) => {
        if (index === 0) {
          path.moveTo(point.x, point.y);
          return;
        }

        const previous = chartPoints[index - 1];
        const controlX = (previous.x + point.x) / 2;
        path.bezierCurveTo(controlX, previous.y, controlX, point.y, point.x, point.y);
      });

      const area = new Path2D(path);
      area.lineTo(chartPoints[chartPoints.length - 1].x, height - padding.bottom);
      area.lineTo(chartPoints[0].x, height - padding.bottom);
      area.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, fillStart);
      gradient.addColorStop(1, fillEnd);
      ctx.fillStyle = gradient;
      ctx.fill(area);

      ctx.strokeStyle = text;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(path);

      const endpoint = chartPoints[chartPoints.length - 1];
      ctx.beginPath();
      ctx.arc(endpoint.x, endpoint.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = text;
      ctx.fill();

      ctx.fillStyle = muted;
      ctx.font = '700 10px "JetBrains Mono"';
      chartPoints.forEach((point, index) => {
        ctx.fillText(`D${index + 1}`, point.x - 10, height - 14);
      });
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);

    const themeObserver = new MutationObserver(draw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [processedData]);

  if (!processedData || !stats) {
    return <p className="theme-text-secondary py-4 text-center text-sm">{t.noHistoryData}</p>;
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || pointsRef.current.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const closest = pointsRef.current.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best), pointsRef.current[0]);

    setTooltip({
      x: closest.x,
      y: closest.y,
      date: closest.date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
      rate: closest.rate,
    });
  };

  return (
    <div className="theme-chart theme-surface-card theme-border theme-shadow-soft relative w-full overflow-hidden rounded-lg border p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="theme-surface-muted theme-border rounded-lg border p-3">
          <p className="theme-text-secondary font-data text-[10px] font-black uppercase">High</p>
          <p className="theme-text-primary font-data mt-1 text-sm font-black" dir="ltr">{stats.high.toLocaleString()}</p>
        </div>
        <div className="theme-surface-muted theme-border rounded-lg border p-3">
          <p className="theme-text-secondary font-data text-[10px] font-black uppercase">Low</p>
          <p className="theme-text-primary font-data mt-1 text-sm font-black" dir="ltr">{stats.low.toLocaleString()}</p>
        </div>
        <div className="theme-surface-muted theme-border rounded-lg border p-3">
          <p className="theme-text-secondary font-data text-[10px] font-black uppercase">Avg</p>
          <p className="theme-text-primary font-data mt-1 text-sm font-black" dir="ltr">{stats.avg.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative" dir="ltr">
        <canvas
          ref={canvasRef}
          className="theme-surface-muted theme-border block h-[280px] w-full rounded-lg border"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setTooltip(null)}
          aria-label={t.rateHistoryTitle}
        />

        {tooltip && (
          <div
            className="theme-tooltip pointer-events-none absolute rounded-lg border p-2 text-center shadow-xl"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: tooltip.x > 260 ? 'translate(-90%, -115%)' : 'translate(-10%, -115%)',
            }}
          >
            <p className="font-data text-xs font-black">{tooltip.rate.toLocaleString()}</p>
            <p className="mt-1 whitespace-nowrap text-[9px] opacity-70">{tooltip.date}</p>
          </div>
        )}
      </div>
    </div>
  );
};
