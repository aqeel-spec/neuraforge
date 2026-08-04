'use client';

import { motion } from 'framer-motion';

export interface SiriOrbProps {
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colors?: string[];
  className?: string;
}

const sizeMap = { sm: 64, md: 128, lg: 200 };

export function SiriOrb({
  active = false,
  size = 'md',
  colors = ['#a855f7', '#3b82f6', '#06b6d4', '#10b981'],
  className = '',
}: SiriOrbProps) {
  const px = sizeMap[size];
  const gradient = `radial-gradient(circle, ${colors.join(', ')})`;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
    >
      {/* Outer glow layer */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-40 blur-xl"
        style={{ background: gradient }}
        animate={
          active
            ? { scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }
            : { scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }
        }
        transition={{ duration: active ? 1.2 : 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Middle layer */}
      <motion.div
        className="absolute rounded-full blur-md"
        style={{ width: px * 0.75, height: px * 0.75, background: gradient }}
        animate={
          active
            ? { scale: [1, 1.2, 0.95, 1], rotate: [0, 180, 360] }
            : { scale: [1, 1.03, 1] }
        }
        transition={{ duration: active ? 1.5 : 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Core */}
      <motion.div
        className="relative rounded-full"
        style={{ width: px * 0.5, height: px * 0.5, background: gradient }}
        animate={
          active
            ? { scale: [1, 1.15, 0.9, 1] }
            : { scale: [1, 1.02, 1] }
        }
        transition={{ duration: active ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default SiriOrb;
