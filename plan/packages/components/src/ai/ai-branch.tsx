'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AiBranchItem {
  id: string;
  label: string;
  content: string;
  isActive?: boolean;
}

export interface AiBranchProps {
  branches: AiBranchItem[];
  onSelect: (id: string) => void;
  className?: string;
}

export function AiBranch({ branches, onSelect, className = '' }: AiBranchProps) {
  const activeId = branches.find((b) => b.isActive)?.id ?? branches[0]?.id;
  const activeContent = branches.find((b) => b.id === activeId)?.content ?? '';

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden ${className}`}
    >
      {/* Tab headers */}
      <div
        className="flex border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto"
        role="tablist"
        aria-label="Conversation branches"
      >
        {branches.map((branch) => {
          const isActive = branch.id === activeId;
          return (
            <button
              key={branch.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`branch-panel-${branch.id}`}
              id={`branch-tab-${branch.id}`}
              onClick={() => onSelect(branch.id)}
              className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {branch.label}
              {isActive && (
                <motion.div
                  layoutId="ai-branch-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            id={`branch-panel-${activeId}`}
            role="tabpanel"
            aria-labelledby={`branch-tab-${activeId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed"
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
