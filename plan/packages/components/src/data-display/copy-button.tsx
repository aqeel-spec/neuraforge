'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Button label (default: 'Copy') */
  label?: string;
  /** Label shown after successful copy (default: 'Copied!') */
  successLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional custom trigger element */
  children?: React.ReactNode;
}

/**
 * CopyButton — A button that copies text to the clipboard with visual and accessible feedback.
 *
 * SSR-safe: clipboard API access is guarded by typeof navigator check.
 * Shows success feedback for 2 seconds then reverts.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  successLabel = 'Copied!',
  className = '',
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard write failed silently
      }
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const buttonLabel = copied ? successLabel : label;

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
          bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
          hover:bg-gray-200 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          transition-colors ${className}`}
        aria-label={buttonLabel}
      >
        {children ? (
          children
        ) : (
          <>
            {copied ? (
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
            <span>{buttonLabel}</span>
          </>
        )}
      </button>
      {/* Accessible live announcement */}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  );
};

export default CopyButton;
