'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AISourceItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  snippet?: string;
}

export interface AISourcesProps {
  sources: AISourceItem[];
  className?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function AISources({ sources, className = '' }: AISourcesProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}
      role="list"
      aria-label="Sources"
    >
      {sources.map((source) => (
        <motion.a
          key={source.id}
          variants={item}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          role="listitem"
          className="group flex flex-col gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          <div className="flex items-center gap-2 min-w-0">
            {source.favicon ? (
              <img
                src={source.favicon}
                alt=""
                className="w-4 h-4 rounded shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-600 shrink-0" />
            )}
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {source.title}
            </span>
          </div>

          {source.snippet && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {source.snippet}
            </p>
          )}

          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-auto">
            {new URL(source.url).hostname}
          </span>
        </motion.a>
      ))}
    </motion.div>
  );
}
