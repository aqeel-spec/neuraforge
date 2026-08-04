'use client';
import { useState } from "react";

import { motion } from 'framer-motion';

export interface ContributionGraphProps {
  data: { date: string; count: number }[];
  colorScale?: string[];
  className?: string;
}

const defaultScale = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-600 dark:bg-green-500',
  'bg-green-800 dark:bg-green-400',
];

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function ContributionGraph({ data, colorScale, className = '' }: ContributionGraphProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const scale = colorScale ?? defaultScale;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-[3px]">
        {data.map((entry) => {
          const level = getLevel(entry.count, maxCount);
          const colorClass = scale[level] ?? scale[0];
          return (
            <motion.div
              key={entry.date}
              className={`w-3 h-3 rounded-sm cursor-pointer ${colorClass}`}
              whileHover={{ scale: 1.5 }}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({ date: entry.date, count: entry.count, x: rect.left, y: rect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </div>
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 30 }}
        >
          {tooltip.count} contributions on {tooltip.date}
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
