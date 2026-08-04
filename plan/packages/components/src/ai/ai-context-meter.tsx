'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export interface AiContextMeterProps {
  used: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function getStatus(
  percentage: number,
  warning: number,
  danger: number,
): 'normal' | 'warning' | 'danger' {
  if (percentage >= danger) return 'danger';
  if (percentage >= warning) return 'warning';
  return 'normal';
}

const gradientByStatus = {
  normal: 'from-emerald-400 via-cyan-400 to-indigo-500',
  warning: 'from-amber-400 via-orange-400 to-yellow-500',
  danger: 'from-red-500 via-rose-500 to-pink-500',
} as const;

const glowByStatus = {
  normal: '',
  warning: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
  danger: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
} as const;

const textColorByStatus = {
  normal: 'text-slate-600 dark:text-slate-300',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
} as const;

export function AiContextMeter({
  used,
  total,
  label = 'Context usage',
  showPercentage = true,
  warningThreshold = 70,
  dangerThreshold = 90,
  className = '',
}: AiContextMeterProps) {
  const percentage = useMemo(
    () => Math.min(Math.round((used / total) * 100), 100),
    [used, total],
  );

  const status = useMemo(
    () => getStatus(percentage, warningThreshold, dangerThreshold),
    [percentage, warningThreshold, dangerThreshold],
  );

  return (
    <div
      className={`w-full space-y-2 ${className}`}
      role="meter"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <span className={`text-sm font-semibold tabular-nums ${textColorByStatus[status]}`}>
          {showPercentage && <span>{percentage}% · </span>}
          {formatNumber(used)} / {formatNumber(total)}
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradientByStatus[status]} ${glowByStatus[status]}`}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '250%'] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 0.8,
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Status indicator */}
      {status !== 'normal' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-1.5 text-xs font-medium ${textColorByStatus[status]}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
          {status === 'warning' ? 'Approaching limit' : 'Near capacity'}
        </motion.div>
      )}
    </div>
  );
}

export default AiContextMeter;
