'use client';
import { type ReactNode } from "react";

import { motion } from 'framer-motion';

export interface SocialSelectorProps {
  platforms: { id: string; name: string; icon: ReactNode; color: string }[];
  selected?: string[];
  onToggle?: (id: string) => void;
  className?: string;
}

export function SocialSelector({ platforms, selected = [], onToggle, className = '' }: SocialSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        return (
          <motion.button
            key={platform.id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-colors ${
              isSelected
                ? 'border-current bg-opacity-10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
            }`}
            style={isSelected ? { color: platform.color, borderColor: platform.color, backgroundColor: `${platform.color}15` } : undefined}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle?.(platform.id)}
          >
            <span className="w-5 h-5 flex items-center justify-center">{platform.icon}</span>
            <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700 dark:text-gray-300'}`}>
              {platform.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default SocialSelector;
