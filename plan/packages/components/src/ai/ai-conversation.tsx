'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AiConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AiConversationProps {
  messages: AiConversationMessage[];
  title?: string;
  className?: string;
}

const messageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const AiConversation: React.FC<AiConversationProps> = ({
  messages,
  title,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      role="log"
      aria-label={title || 'Conversation thread'}
    >
      {title && (
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h2>
      )}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  {msg.timestamp && (
                    <span
                      className={`block text-xs mt-1 ${
                        isUser
                          ? 'text-blue-200'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiConversation;
