'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Props for PerWordCrossfade */
export interface PerWordCrossfadeProps {
  /** Array of words to cycle through */
  words: string[];
  /** Interval in milliseconds between transitions (default: 3000) */
  interval?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PerWordCrossfade — Displays one word at a time with crossfade transitions.
 * Cycles through the provided words array with AnimatePresence. SSR-safe.
 */
export const PerWordCrossfade: React.FC<PerWordCrossfadeProps> = ({
  words,
  interval = 3000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [advance, interval, words.length]);

  if (words.length === 0) return null;

  return (
    <span
      className={`relative inline-block ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${words[currentIndex]}-${currentIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="inline-block text-inherit dark:text-inherit"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

PerWordCrossfade.displayName = 'PerWordCrossfade';
export default PerWordCrossfade;
