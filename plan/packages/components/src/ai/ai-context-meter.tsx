'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AiContextMeterProps {
  used: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
  variant?: 'bar' | 'radial';
  className?: string;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

function getStatus(pct: number, warn: number, danger: number) {
  if (pct >= danger) return 'danger' as const;
  if (pct >= warn) return 'warning' as const;
  return 'normal' as const;
}

const statusColors = {
  normal: { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-500', bg: 'bg-emerald-500' },
  warning: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-500', bg: 'bg-amber-500' },
  danger: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', text: 'text-red-500', bg: 'bg-red-500' },
};

function RadialMeter({ percentage, status }: { percentage: number; status: 'normal' | 'warning' | 'danger' }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = statusColors[status];

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-700" />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
          stroke={colors.stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{percentage}%</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">used</span>
      </div>
    </div>
  );
}

function BarMeter({ percentage, status }: { percentage: number; status: 'normal' | 'warning' | 'danger' }) {
  const shouldReduceMotion = useReducedMotion();
  const colors = statusColors[status];
  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: colors.stroke, filter: `drop-shadow(0 0 4px ${colors.glow})` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ mixBlendMode: 'overlay' }}
          >
            <motion.div
              className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '400%'] }}
              transition={{ duration: 2, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'linear', repeatDelay: 1 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export function AiContextMeter({
  used,
  total,
  label = 'Context Window',
  showPercentage = true,
  warningThreshold = 70,
  dangerThreshold = 90,
  variant = 'bar',
  className = '',
}: AiContextMeterProps) {
  const percentage = useMemo(() => Math.min(Math.round((used / total) * 100), 100), [used, total]);
  const status = useMemo(() => getStatus(percentage, warningThreshold, dangerThreshold), [percentage, warningThreshold, dangerThreshold]);
  const colors = statusColors[status];

  if (variant === 'radial') {
    return (
      <div className={`flex items-center gap-5 ${className}`} role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={total} aria-label={label}>
        <RadialMeter percentage={percentage} status={status} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
            {formatNumber(used)} <span className="text-slate-400 font-normal">/ {formatNumber(total)}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse motion-reduce:animate-none`} />
            <span className={`text-xs font-medium ${colors.text}`}>
              {status === 'normal' ? 'Healthy' : status === 'warning' ? 'Getting full' : 'Near limit'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-3 ${className}`} role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={total} aria-label={label}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.bg} ${status !== 'normal' ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {formatNumber(used)} <span className="text-slate-400 font-normal">/ {formatNumber(total)} tokens</span>
          {showPercentage && <span className={`ml-2 ${colors.text}`}>({percentage}%)</span>}
        </span>
      </div>
      <BarMeter percentage={percentage} status={status} />
      {status !== 'normal' && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs font-medium ${colors.text}`}>
          {status === 'warning' ? '⚠️ Context window filling up — consider summarizing earlier messages' : '🚨 Near capacity — responses may be truncated'}
        </motion.p>
      )}
    </div>
  );
}

export default AiContextMeter;
