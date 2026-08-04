'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export interface StatItem {
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface StatsAnimatedProps {
  stats: StatItem[];
  title?: string;
  description?: string;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

/**
 * Safe animated counter. If value is not a plain number, renders it as-is
 * (no animation) to avoid framer-motion animating non-numeric values.
 */
function Counter({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  const isNumeric = Number.isFinite(numeric);
  const [display, setDisplay] = useState(isNumeric ? 0 : null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric) return;

    const duration = 1600;
    const start = performance.now();
    const decimals = String(numeric).includes('.') ? 1 : 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Number((numeric * eased).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [numeric, isNumeric]);

  if (!isNumeric) {
    return <span>{prefix}{value}{suffix}</span>;
  }

  const formatted = display !== null && display >= 1000
    ? display.toLocaleString('en-US')
    : String(display ?? 0);

  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>;
}

const variantStyles = {
  default: 'flex flex-col items-center text-center',
  card: 'flex flex-col items-center text-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm',
  minimal: 'flex flex-col items-start text-left',
} as const;

export function StatsAnimated({
  stats,
  title,
  description,
  variant = 'default',
  className = '',
}: StatsAnimatedProps) {
  return (
    <section className={`w-full py-12 px-4 sm:px-6 ${className}`}>
      {(title || description) && (
        <div className="max-w-2xl mx-auto text-center mb-10">
          {title && <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>}
          {description && <p className="mt-3 text-slate-600 dark:text-zinc-400">{description}</p>}
        </div>
      )}
      <motion.dl
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
      >
        {stats.map((stat, i) => (
          <div key={`${stat.label}-${i}`} className={variantStyles[variant]}>
            <dd className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1">
              <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            </dd>
            <dt className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
              {stat.label}
            </dt>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}

export default StatsAnimated;
