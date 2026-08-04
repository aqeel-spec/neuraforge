'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AiSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  variant?: 'pill' | 'card';
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const AiSuggestions: React.FC<AiSuggestionsProps> = ({
  suggestions,
  onSelect,
  variant = 'pill',
  className = '',
}) => {
  const isPill = variant === 'pill';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Suggested prompts"
    >
      {suggestions.map((suggestion, idx) => (
        <motion.button
          key={idx}
          variants={itemVariants}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={
            isPill
              ? 'px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
              : 'px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left'
          }
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default AiSuggestions;
