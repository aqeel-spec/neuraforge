'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface AiResponseProps {
  content: string;
  isStreaming?: boolean;
  speed?: number;
  onComplete?: () => void;
  copyable?: boolean;
  className?: string;
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function AiResponse({
  content,
  isStreaming = false,
  speed = 20,
  onComplete,
  copyable = true,
  className = '',
}: AiResponseProps) {
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : content);
  const [copied, setCopied] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(!isStreaming);
  const shouldReduceMotion = useReducedMotion();

  // Streaming character reveal
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      completedRef.current = true;
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    completedRef.current = false;

    function tick() {
      indexRef.current += 1;
      const next = content.slice(0, indexRef.current);
      setDisplayedText(next);

      if (indexRef.current >= content.length) {
        completedRef.current = true;
        onComplete?.();
        return;
      }
      timerRef.current = setTimeout(tick, speed);
    }

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, isStreaming, speed, onComplete]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some environments
    }
  }, [content]);

  return (
    <div
      className={`relative rounded-xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 ${className}`}
    >
      {/* Text content */}
      <div className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
        <span className="whitespace-pre-wrap">{displayedText}</span>

        {/* Animated gradient cursor */}
        {isStreaming && !completedRef.current && (
          <motion.span
            className="ml-0.5 inline-block h-[18px] w-[3px] translate-y-[3px] rounded-full bg-gradient-to-b from-violet-500 via-indigo-500 to-cyan-500"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.8, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Copy button */}
      {copyable && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="text-emerald-500"
                >
                  <CheckIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <CopyIcon />
                </motion.span>
              )}
            </AnimatePresence>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AiResponse;
