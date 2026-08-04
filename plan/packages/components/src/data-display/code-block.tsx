'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface CodeBlockProps {
  /** Code string to display */
  code: string;
  /** Language label (for display/aria, no syntax parsing) */
  language?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Lines to highlight (1-indexed) */
  highlightLines?: number[];
  /** Title shown above the code block */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show a copy-to-clipboard button */
  copyable?: boolean;
}

/**
 * CodeBlock — Displays code with optional line numbers, line highlighting, and a copy button.
 *
 * Uses Tailwind for all styling. No external syntax highlighting library.
 * SSR-safe: clipboard copy is guarded by navigator check.
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = '',
  showLineNumbers = false,
  highlightLines = [],
  title,
  className = '',
  copyable = false,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard write failed silently
      }
    }
  }, [code]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const lines = code.split('\n');
  const highlightSet = new Set(highlightLines);

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950 text-gray-100 ${className}`}
    >
      {/* Header */}
      {(title || language || copyable) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm font-medium text-gray-300 dark:text-gray-400">
                {title}
              </span>
            )}
            {language && !title && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase">
                {language}
              </span>
            )}
          </div>
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-2 py-1 rounded bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-400 hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 transition-colors"
              aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}

      {/* Announcement for screen readers */}
      {copied && (
        <div aria-live="polite" className="sr-only">
          Code copied to clipboard
        </div>
      )}

      {/* Code content */}
      <pre
        className="overflow-x-auto p-4 text-sm leading-relaxed"
        tabIndex={0}
        role="region"
        aria-label={title ? `Code: ${title}` : `Code block${language ? ` (${language})` : ''}`}
      >
        <code className="font-mono">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isHighlighted = highlightSet.has(lineNum);
            return (
              <span
                key={i}
                className={`block ${isHighlighted ? 'bg-blue-500/20 dark:bg-blue-400/15 -mx-4 px-4' : ''}`}
              >
                {showLineNumbers && (
                  <span
                    className="inline-block w-8 mr-4 text-right text-gray-500 dark:text-gray-600 select-none"
                    aria-hidden="true"
                  >
                    {lineNum}
                  </span>
                )}
                {line}
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
