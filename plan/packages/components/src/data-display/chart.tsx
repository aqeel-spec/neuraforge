'use client';

import React from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  /** Chart type */
  type: 'bar' | 'line' | 'pie' | 'donut';
  /** Data points to render */
  data: ChartDataPoint[];
  /** SVG width in pixels */
  width?: number;
  /** SVG height in pixels */
  height?: number;
  /** Accessible title for the chart */
  title: string;
  /** Additional CSS classes */
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

function getColor(index: number, color?: string): string {
  return color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? '#3b82f6';
}

function BarChart({ data, width, height }: { data: ChartDataPoint[]; width: number; height: number }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(1, (chartWidth / data.length) * 0.7);
  const gap = (chartWidth / data.length) * 0.3;

  return (
    <g>
      {/* Y-axis */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {/* X-axis */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {/* Bars */}
      {data.map((point, i) => {
        const barHeight = (point.value / maxValue) * chartHeight;
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={point.label + i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={getColor(i, point.color)}
              rx={2}
              ry={2}
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              className="fill-gray-700 dark:fill-gray-300 text-[10px]"
              fontSize={10}
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LineChart({ data, width, height }: { data: ChartDataPoint[]; width: number; height: number }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((point, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (point.value / maxValue) * chartHeight;
    return { x, y, ...point };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <g>
      {/* Y-axis */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {/* X-axis */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        className="stroke-blue-500 dark:stroke-blue-400"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Data points */}
      {points.map((point, i) => (
        <g key={point.label + i}>
          <circle
            cx={point.x}
            cy={point.y}
            r={4}
            fill={getColor(i, point.color)}
            className="stroke-white dark:stroke-gray-900"
            strokeWidth={2}
          >
            <title>{`${point.label}: ${point.value}`}</title>
          </circle>
          <text
            x={point.x}
            y={padding.top + chartHeight + 16}
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300 text-[10px]"
            fontSize={10}
          >
            {point.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function PieChart({
  data,
  width,
  height,
  donut = false,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  donut?: boolean;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = donut ? radius * 0.6 : 0;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  let currentAngle = -Math.PI / 2;

  const segments = data.map((point, i) => {
    const angle = (point.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;

    const x1Outer = cx + radius * Math.cos(startAngle);
    const y1Outer = cy + radius * Math.sin(startAngle);
    const x2Outer = cx + radius * Math.cos(endAngle);
    const y2Outer = cy + radius * Math.sin(endAngle);

    let d: string;
    if (donut) {
      const x1Inner = cx + innerRadius * Math.cos(startAngle);
      const y1Inner = cy + innerRadius * Math.sin(startAngle);
      const x2Inner = cx + innerRadius * Math.cos(endAngle);
      const y2Inner = cy + innerRadius * Math.sin(endAngle);
      d = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        `L ${x2Inner} ${y2Inner}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
        'Z',
      ].join(' ');
    } else {
      d = [
        `M ${cx} ${cy}`,
        `L ${x1Outer} ${y1Outer}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        'Z',
      ].join(' ');
    }

    return (
      <path key={point.label + i} d={d} fill={getColor(i, point.color)}>
        <title>{`${point.label}: ${point.value} (${Math.round((point.value / total) * 100)}%)`}</title>
      </path>
    );
  });

  return <g>{segments}</g>;
}

/**
 * Chart — An accessible SVG chart component supporting bar, line, pie, and donut types.
 *
 * Renders charts purely with SVG. No external charting libraries required.
 * Respects `prefers-reduced-motion` by disabling animations.
 */
export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  width = 400,
  height = 300,
  title,
  className = '',
}) => {
  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={title}
      className={`motion-safe:transition-opacity ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <title>{title}</title>
      {type === 'bar' && <BarChart data={data} width={width} height={height} />}
      {type === 'line' && <LineChart data={data} width={width} height={height} />}
      {type === 'pie' && <PieChart data={data} width={width} height={height} />}
      {type === 'donut' && <PieChart data={data} width={width} height={height} donut />}
    </svg>
  );
};

export default Chart;
