'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AiToolCallProps {
  name: string;
  parameters?: Record<string, unknown>;
  result?: string;
  status?: 'calling' | 'success' | 'error';
  duration?: string;
  className?: string;
}

function ToolStatusIcon({ status }: { status: AiToolCallProps['status'] }) {
  switch (status) {
    case 'success':
      return (
        <svg
          className="w-4 h-4 text-green-500 dark:text-green-400"
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
          className="w-4 h-4 text-red-500 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'calling':
    default:
      return (
        <motion.div
          className="w-4 h-4 rounded-full border-2 border-amber-500 dark:border-amber-400 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      );
  }
}

export function AiToolCall({
  name,
  parameters,
  result,
  status = 'calling',
  duration,
  className = '',
}: AiToolCallProps) {
  const [paramsExpanded, setParamsExpanded] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(false);

  const statusLabel =
    status === 'calling' ? 'Calling…' : status === 'success' ? 'Completed' : 'Failed';

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-mono text-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850">
        <ToolStatusIcon status={status} />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{name}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto flex items-center gap-2">
          {duration && <span>{duration}</span>}
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
              status === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : status === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}
          >
            {statusLabel}
          </span>
        </span>
      </div>

      {/* Parameters */}
      {parameters && Object.keys(parameters).length > 0 && (
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setParamsExpanded(!paramsExpanded)}
            aria-expanded={paramsExpanded}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
          >
            <svg
              className={`w-3 h-3 transition-transform ${paramsExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Parameters
          </button>

          <AnimatePresence initial={false}>
            {paramsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="px-4 pb-3 text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(parameters, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <button
            onClick={() => setResultExpanded(!resultExpanded)}
            aria-expanded={resultExpanded}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
          >
            <svg
              className={`w-3 h-3 transition-transform ${resultExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Result
          </button>

          <AnimatePresence initial={false}>
            {resultExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="px-4 pb-3 text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                  {result}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
