'use client';

import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export function NestedDrawer({ open, onClose, className }: DrawerProps) {
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Nested Drawer" onClose={onClose} />
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click below to open an inner drawer.
        </p>
        <button
          onClick={() => setInnerOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Open Inner Drawer
        </button>
      </div>
      {/* Inner Drawer */}
      <AnimatePresence>
        {innerOpen && (
          <motion.div
            className="absolute inset-0 z-10 bg-white dark:bg-gray-900 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <DrawerHeader title="Inner Drawer" onClose={() => setInnerOpen(false)} />
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is the nested inner drawer. Press close or Escape to go back.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DrawerShell>
  );
}
