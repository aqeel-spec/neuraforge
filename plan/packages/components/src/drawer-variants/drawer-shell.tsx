'use client';

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

// ─── Base Drawer Shell ────────────────────────────────────────────────────────

export function DrawerShell({
  open,
  onClose,
  className = '',
  children,
}: DrawerProps & { children: React.ReactNode }) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleEscape]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            className={`fixed top-0 right-0 z-[101] h-full w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col ${className}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
