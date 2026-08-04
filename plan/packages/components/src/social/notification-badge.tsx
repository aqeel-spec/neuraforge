'use client';
import { type ReactNode } from "react";

import { motion, useReducedMotion } from 'framer-motion';

export interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'dot' | 'count';
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

export function NotificationBadge({
  count,
  max = 99,
  variant = 'count',
  pulse = false,
  children,
  className = '',
}: NotificationBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const displayCount = count > max ? `${max}+` : String(count);
  const show = count > 0;

  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      {show && (
        <motion.span
          className={`absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold ${
            variant === 'dot'
              ? 'w-3 h-3'
              : 'min-w-[20px] h-5 px-1.5 text-[11px]'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {variant === 'count' && displayCount}
          {pulse && !shouldReduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </motion.span>
      )}
    </div>
  );
}

export default NotificationBadge;
