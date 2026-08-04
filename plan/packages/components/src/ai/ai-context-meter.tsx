'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AiContextMeterProps {
  used: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  warningThreshold?: number;
  className?: string;
}

function getColor(percentage: number, warningThreshold: number): string {
  if (percentage >= 90) return 'bg-red-500 dark:bg-red-400';
  if (percentage >= warningThreshold) return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-green-500 dark:bg-green-400';
}

export const AiContextMeter: React.FC<AiContextMeterProps> = ({
  used,
  total,
  label = 'Token usage',
  showPercentage = true,
  warningThreshold = 70,
  className = '',
}) => {
  const percentage = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  const colorClass = getColor(percentage, warningThreshold);

  return (
    <div className={`w-full ${className}`} role="group" aria-label={label}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {showPercentage && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}% ({used.toLocaleString()} / {total.toLocaleString()})
          </span>
        )}
      </div>
      <div
        className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label}: ${percentage}%`}
      >
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default AiContextMeter;
