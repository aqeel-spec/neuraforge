'use client';

import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AIBCitationSource {
  title: string;
  url?: string;
  snippet?: string;
}

export interface AiCitationProps {
  index: number;
  source: AIBCitationSource;
  className?: string;
}

export function AiCitation({ index, source, className = '' }: AiCitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <button
        aria-label={`Citation ${index}: ${source.title}`}
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center text-[0.65em] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-900 rounded align-super min-w-[1.2em] cursor-pointer transition-colors"
      >
        [{index}]
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg p-3"
            onMouseEnter={open}
            onMouseLeave={close}
          >
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {source.title}
            </p>
            {source.snippet && (
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {source.snippet}
              </p>
            )}
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                View source ↗
              </a>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white dark:bg-neutral-800 border-b border-r border-neutral-200 dark:border-neutral-700 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
