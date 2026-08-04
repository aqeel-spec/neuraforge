'use client';
import { useState, type ReactNode } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface BookProps {
  pages: { id: string; content: ReactNode }[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Book({ pages, currentPage, onPageChange, className = '' }: BookProps) {
  const [internalPage, setInternalPage] = useState(0);
  const page = currentPage ?? internalPage;

  const goTo = (p: number) => {
    const clamped = Math.max(0, Math.min(p, pages.length - 1));
    setInternalPage(clamped);
    onPageChange?.(clamped);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full perspective-[1200px]" style={{ minHeight: 300 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pages[page]?.id ?? page}
            className="w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-8"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {pages[page]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {page + 1} / {pages.length}
        </span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pages.length - 1}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Book;
