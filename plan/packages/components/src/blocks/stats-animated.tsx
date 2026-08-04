'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

export interface StatItem {
  value: number;
  label: string;
  suffix?: string;
}

export interface StatsAnimatedProps {
  stats: StatItem[];
  className?: string;
}

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(String(v)));
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    return controls.stop;
  }, [count, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsAnimated({ stats, className = '' }: StatsAnimatedProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center"
      >
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              <Counter value={stat.value} suffix={stat.suffix} />
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
