'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface DynamicIslandProps {
  expanded: boolean;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  className?: string;
}

export function DynamicIsland({
  expanded,
  children,
  expandedContent,
  className = '',
}: DynamicIslandProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        layout
        className="relative overflow-hidden bg-black dark:bg-gray-900 text-white shadow-2xl"
        animate={{
          borderRadius: expanded ? 24 : 999,
          width: expanded ? 320 : 120,
          height: expanded ? 'auto' : 36,
          minHeight: expanded ? 160 : 36,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          borderRadius: { duration: 0.4 },
        }}
      >
        <motion.div layout="position" className="p-3">
          <AnimatePresence mode="wait">
            {expanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {expandedContent ?? children}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DynamicIsland;
