'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AIReasoningStep {
  id: string;
  title: string;
  content: string;
  status?: 'thinking' | 'complete' | 'error';
}

export interface AIReasoningProps {
  steps: AIReasoningStep[];
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

function StatusIcon({ status }: { status: AIReasoningStep['status'] }) {
  switch (status) {
    case 'complete':
      return (
        <svg
          className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg
          className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'thinking':
    default:
      return (
        <motion.div
          className="w-4 h-4 rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent shrink-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      );
  }
}

export function AIReasoning({ steps, collapsed = true, onToggle, className = '' }: AIReasoningProps) {
  const isThinking = steps.some((s) => s.status === 'thinking');

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 overflow-hidden ${className}`}
    >
      {/* Header / toggle */}
      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        {isThinking && (
          <motion.div
            className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        )}
        <span>{isThinking ? 'Thinking…' : 'Thought process'}</span>
        <svg
          className={`ml-auto w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Timeline */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0">
              {steps.map((step, i) => (
                <div key={step.id} className="relative flex gap-3 pl-2">
                  {/* Timeline line */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
                  )}

                  {/* Icon */}
                  <div className="pt-1">
                    <StatusIcon status={step.status} />
                  </div>

                  {/* Content */}
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
