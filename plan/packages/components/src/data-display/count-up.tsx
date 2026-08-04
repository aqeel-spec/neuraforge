'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface CountUpProps {
  /** Target number to count up to */
  end: number;
  /** Starting number (default: 0) */
  start?: number;
  /** Animation duration in milliseconds (default: 2000) */
  duration?: number;
  /** Prefix string (e.g. '$') */
  prefix?: string;
  /** Suffix string (e.g. '%') */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Additional CSS classes */
  className?: string;
  /** Thousands separator (e.g. ',') */
  separator?: string;
}

function formatNumber(value: number, decimals: number, separator: string): string {
  const fixed = value.toFixed(decimals);
  if (!separator) return fixed;

  const [intPart, decPart] = fixed.split('.');
  const formatted = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

/**
 * CountUp — Animates a number from start to end using requestAnimationFrame.
 *
 * SSR-safe: renders the final value on server; animates on client mount.
 * Respects prefers-reduced-motion: shows final value immediately if motion is reduced.
 */
export const CountUp: React.FC<CountUpProps> = ({
  end,
  start = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  separator = '',
}) => {
  const [displayValue, setDisplayValue] = useState(end);
  const [isMounted, setIsMounted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const prefersReducedMotion = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // If reduced motion is preferred, show final value immediately
    if (prefersReducedMotion()) {
      setDisplayValue(end);
      return;
    }

    setDisplayValue(start);
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isMounted, start, end, duration, prefersReducedMotion]);

  const formattedValue = formatNumber(displayValue, decimals, separator);

  return (
    <span className={`tabular-nums ${className}`} aria-label={`${prefix}${formatNumber(end, decimals, separator)}${suffix}`}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};

export default CountUp;
