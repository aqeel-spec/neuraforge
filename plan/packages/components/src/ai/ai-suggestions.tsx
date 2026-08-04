'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';

export interface AiSuggestionsProps {
  suggestions: string[];
  onSelect: (s: string) => void;
  variant?: 'default' | 'gradient';
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 22 },
  },
};

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function AiSuggestions({
  suggestions,
  onSelect,
  variant = 'default',
  className = '',
}: AiSuggestionsProps) {
  const handleClick = useCallback(
    (suggestion: string) => () => onSelect(suggestion),
    [onSelect],
  );

  const isGradient = variant === 'gradient';

  const baseClasses = isGradient
    ? 'border-violet-300/50 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 hover:border-violet-400 hover:from-violet-500 hover:to-indigo-500 hover:text-white dark:border-violet-500/30 dark:text-violet-300 dark:hover:border-violet-400 dark:hover:text-white'
    : 'border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-gradient-to-r hover:from-violet-500 hover:to-indigo-500 hover:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:text-white';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Suggestions"
    >
      {suggestions.map((suggestion, i) => (
        <motion.button
          key={`${suggestion}-${i}`}
          variants={itemVariants}
          whileTap={{ scale: 0.94 }}
          onClick={handleClick(suggestion)}
          className={`group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${baseClasses}`}
        >
          <span className="relative z-10 truncate">{suggestion}</span>

          {/* Arrow slides in on hover */}
          <span className="relative z-10 w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-[14px] group-hover:opacity-100">
            <ArrowIcon />
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

export default AiSuggestions;
