'use client';

import { motion } from 'framer-motion';

export interface SwitchboardCardProps {
  title: string;
  switches: { id: string; label: string; enabled: boolean }[];
  onToggle?: (id: string, enabled: boolean) => void;
  className?: string;
}

export function SwitchboardCard({ title, switches, onToggle, className = '' }: SwitchboardCardProps) {
  return (
    <motion.div
      className={`rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md p-5 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {switches.map((sw) => (
          <div key={sw.id} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">{sw.label}</span>
            <button
              role="switch"
              aria-checked={sw.enabled}
              onClick={() => onToggle?.(sw.id, !sw.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                sw.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: sw.enabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default SwitchboardCard;
