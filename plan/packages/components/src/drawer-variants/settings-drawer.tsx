'use client';

import { useState } from "react";
import { motion } from 'framer-motion';
import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export function SettingsDrawer({ open, onClose, className }: DrawerProps) {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    analytics: false,
    autoSave: true,
  });

  const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Settings" onClose={onClose} />
      <div className="flex-1 p-6 space-y-1">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
            <button
              role="switch"
              aria-checked={value}
              onClick={() => toggle(key as keyof typeof settings)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: value ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
    </DrawerShell>
  );
}
