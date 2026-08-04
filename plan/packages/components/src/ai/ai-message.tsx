'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AiMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  avatar?: React.ReactNode;
  timestamp?: string;
  isStreaming?: boolean;
  className?: string;
}

export const AiMessage: React.FC<AiMessageProps> = ({
  role,
  content,
  avatar,
  timestamp,
  isStreaming = false,
  className = '',
}) => {
  if (role === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex justify-center py-2 ${className}`}
      >
        <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center max-w-md">
          {content}
        </p>
      </motion.div>
    );
  }

  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}
    >
      {avatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          {avatar}
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-current"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </p>
        {timestamp && (
          <span
            className={`block text-xs mt-1 ${
              isUser ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default AiMessage;
