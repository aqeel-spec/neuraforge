'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AiResponseProps {
  content: string;
  isStreaming?: boolean;
  speed?: number;
  onComplete?: () => void;
  copyable?: boolean;
  className?: string;
}

export const AiResponse: React.FC<AiResponseProps> = ({
  content,
  isStreaming = false,
  speed = 30,
  onComplete,
  copyable = false,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const indexRef = React.useRef(0);
  const onCompleteRef = React.useRef(onComplete);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      indexRef.current = content.length;
      return;
    }

    // Reset when content changes while streaming
    indexRef.current = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= content.length) {
        setDisplayedText(content);
        clearInterval(interval);
        onCompleteRef.current?.();
      } else {
        setDisplayedText(content.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, isStreaming, speed]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative group ${className}`}
    >
      <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
        {displayedText}
        {isStreaming && indexRef.current < content.length && (
          <motion.span
            className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-gray-900 dark:bg-gray-100"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        )}
      </div>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </motion.div>
  );
};

export default AiResponse;
