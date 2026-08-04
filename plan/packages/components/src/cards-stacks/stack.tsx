'use client';
import { type ReactNode } from "react";

import { motion } from 'framer-motion';

export interface StackProps {
  items: { id: string; content: ReactNode }[];
  offset?: number;
  className?: string;
}

export function Stack({ items, offset = 8, className = '' }: StackProps) {
  return (
    <div className={`relative ${className}`} style={{ height: `calc(100% + ${items.length * offset}px)` }}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="absolute inset-x-0 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md p-4"
          style={{
            top: i * offset,
            zIndex: items.length - i,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          {item.content}
        </motion.div>
      ))}
    </div>
  );
}

export default Stack;
