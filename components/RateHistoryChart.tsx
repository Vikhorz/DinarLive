
import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { RateHistoryEntry, Translation } from '../types';

interface RateHistoryChartProps {
  history: RateHistoryEntry[];
  t: Translation;
}

const SVG_WIDTH = 380;
const SVG_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 60 };
const Y_AXIS_TICKS = 5;

export const RateHistoryChart: React.FC<RateHistoryChartProps> = ({ history, t }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; rate: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const processedData = useMemo(() => {
        if (!history || history.length < 2) return null;
        return history
            .map(d => ({ ...d, date: new Date(d.date) }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history]);

    const scales = useMemo(() => {
        if (!processedData) return null;
        const rates = processedData.map(d => d.rate);
        const dates = processedData.map(d => d.date.getTime());
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const ratePadding = (maxRate - minRate) * 0.1 || 100;
        return {
            minRate: minRate - ratePadding,
            maxRate: maxRate + ratePadding,
            minDate: Math.min(...dates),
            maxDate: Math.max(...dates),
            realMin: minRate,
            realMax: maxRate
        };
    }, [processedData]);

    const { pathD, areaPathD, yAxisLabels, xAxisLabels } = useMemo(() => {
        if (!processedData || !scales) return { pathD: '', areaPathD: '', yAxisLabels: [], xAxisLabels: [] };
        const { minRate, maxRate, minDate, maxDate } = scales;
        const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
        const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
        const getX = (date: Date) => PADDING.left + ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const getY = (rate: number) => PADDING.top + chartHeight - ((rate - minRate) / (maxRate - minRate)) * chartHeight;

        let path = '';
        processedData.forEach((d, i) => {
            const command = i === 0 ? 'M' : 'L';
            path += `${command}${getX(d.date)},${getY(d.rate)} `;
        });
        const areaPath = `${path} V${SVG_HEIGHT - PADDING.bottom} H${PADDING.left} Z`;
        const yLabels = [];
        for (let i = 0; i < Y_AXIS_TICKS; i++) {
            const rate = minRate + (i / (Y_AXIS_TICKS - 1)) * (maxRate - minRate);
            yLabels.push({
                y: getY(rate),
                label: Math.round(rate / 100) * 100,
            });
        }
        const xLabels = [];
        if (processedData.length > 0) {
             const first = processedData[0];
             const last = processedData[processedData.length - 1];
             xLabels.push({ x: getX(first.date), label: first.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
             xLabels.push({ x: getX(last.date), label: last.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
        }
        return { pathD: path, areaPathD: areaPath, yAxisLabels: yLabels, xAxisLabels: xLabels };
    }, [processedData, scales]);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!processedData || !scales || !svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseXInSvg = ((event.clientX - svgRect.left) / svgRect.width) * SVG_WIDTH;

        const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
        const { minDate, maxDate, minRate, maxRate } = scales;
        const getX = (date: Date) => PADDING.left + ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const getY = (rate: number) => PADDING.top + (SVG_HEIGHT - PADDING.top - PADDING.bottom) - ((rate - minRate) / (maxRate - minRate)) * (SVG_HEIGHT - PADDING.top - PADDING.bottom);

        let closestPoint = processedData[0];
        let minDistance = Infinity;
        for (const point of processedData) {
            const pointX = getX(point.date);
            const distance = Math.abs(pointX - mouseXInSvg);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }
        setTooltip({
            x: getX(closestPoint.date),
            y: getY(closestPoint.rate),
            date: closestPoint.date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
            rate: closestPoint.rate
        });
    }, [processedData, scales]);
    
    if (!processedData) {
        return <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">{t.noHistoryData}</p>;
    }

    const getTooltipStyles = () => {
        if (!tooltip) return {};
        const xPercent = (tooltip.x / SVG_WIDTH) * 100;
        const yPercent = (tooltip.y / SVG_HEIGHT) * 100;
        const isNearRight = xPercent > 70;
        const isNearLeft = xPercent < 30;
        const isNearTop = yPercent < 30;
        let translateX = '-50%';
        if (isNearRight) translateX = '-90%';
        if (isNearLeft) translateX = '-10%';
        let translateY = '-110%'; 
        if (isNearTop) translateY = '20%';
        return {
            left: `${xPercent}%`,
            top: `${yPercent}%`,
            transform: `translate(${translateX}, ${translateY})`,
            zIndex: 50
        };
    };

    return (
        <div className="relative w-full overflow-hidden bg-gradient-to-br from-white via-white to-sky-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-sky-950/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
             <div className="flex justify-between px-2 mb-2">
                <span className="text-[10px] text-gray-400 font-mono">High: <span className="text-gray-600 dark:text-gray-300 font-bold">{scales?.realMax.toLocaleString()}</span></span>
                <span className="text-[10px] text-gray-400 font-mono">Low: <span className="text-gray-600 dark:text-gray-300 font-bold">{scales?.realMin.toLocaleString()}</span></span>
             </div>
            <svg 
                ref={svgRef} 
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
                onMouseMove={handleMouseMove} 
                onMouseLeave={() => setTooltip(null)} 
                className="w-full h-auto block"
                style={{ touchAction: 'none' }}
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="text-sky-400 dark:text-sky-500" stopOpacity={0.4} />
                        <stop offset="100%" className="text-sky-400 dark:text-sky-500" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {yAxisLabels.map(({ y, label }) => (
                    <g key={label}>
                        <line x1={PADDING.left} y1={y} x2={SVG_WIDTH - PADDING.right} y2={y} className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={PADDING.left - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 dark:fill-gray-500 font-mono">{label.toLocaleString()}</text>
                    </g>
                ))}
                
                {xAxisLabels.map(({ x, label }) => (
                    <text key={label} x={x} y={SVG_HEIGHT - PADDING.bottom + 15} textAnchor="middle" className="text-[10px] fill-gray-500 dark:fill-gray-400 font-medium">{label}</text>
                ))}

                <path d={areaPathD} fill="url(#areaGradient)" />
                <path d={pathD} fill="none" className="stroke-sky-500 dark:stroke-sky-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={SVG_HEIGHT - PADDING.bottom} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="1" strokeDasharray="3,3" />
                        <circle cx={tooltip.x} cy={tooltip.y} r="5" className="fill-sky-500 stroke-white dark:stroke-gray-800" strokeWidth="2" />
                    </g>
                )}
            </svg>
            
            {tooltip && (
                 <div 
                    className="absolute p-2 text-center bg-gray-900/95 backdrop-blur-sm text-white rounded-lg shadow-xl pointer-events-none transition-transform duration-75 ease-out border border-gray-700"
                    style={getTooltipStyles()}
                >
                    <p className="text-xs font-bold font-mono tracking-tighter">{tooltip.rate.toLocaleString()}</p>
                    <p className="text-[9px] opacity-70 whitespace-nowrap">{tooltip.date}</p>
                </div>
            )}
        </div>
    );
};
