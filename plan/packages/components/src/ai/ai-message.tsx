'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface AiMessageProps {
  role: 'user' | 'assistant';
  content: string;
  avatar?: ReactNode;
  timestamp?: string;
  isStreaming?: boolean;
  className?: string;
}

function DefaultAvatar({ role }: { role: 'user' | 'assistant' }) {
  const isUser = role === 'user';
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md ${
        isUser
          ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
          : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
      }`}
    >
      {isUser ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
          <path d="M18 14a6 6 0 0 0-12 0v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4Z" />
          <circle cx="9" cy="17" r="1" />
          <circle cx="15" cy="17" r="1" />
        </svg>
      )}
    </div>
  );
}

function StreamingCursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[18px] w-[2.5px] rounded-full bg-gradient-to-b from-violet-500 to-indigo-500"
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function AiMessage({
  role,
  content,
  avatar,
  timestamp,
  isStreaming = false,
  className = '',
}: AiMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}
    >
      {/* Avatar */}
      <div className="mt-0.5">
        {avatar ?? <DefaultAvatar role={role} />}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
              : 'rounded-2xl rounded-bl-sm border border-slate-200/80 bg-white/90 text-slate-800 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100'
          }`}
        >
          <span className="whitespace-pre-wrap">{content}</span>
          {isStreaming && !isUser && <StreamingCursor />}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default AiMessage;
