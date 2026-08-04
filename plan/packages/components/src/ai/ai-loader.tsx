'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AiLoaderProps {
  variant?: 'dots' | 'pulse' | 'orbit';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', dot: 'w-1.5 h-1.5', pulse: 'w-6 h-6' },
  md: { container: 'w-12 h-12', dot: 'w-2 h-2', pulse: 'w-10 h-10' },
  lg: { container: 'w-16 h-16', dot: 'w-3 h-3', pulse: 'w-14 h-14' },
} as const;

function DotsVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const { dot } = sizeMap[size];
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`${dot} rounded-full bg-blue-500 dark:bg-blue-400`}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function PulseVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const { pulse } = sizeMap[size];
  return (
    <motion.div
      className={`${pulse} rounded-full bg-blue-500/30 dark:bg-blue-400/30`}
      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.3, 0.7] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-full h-full rounded-full bg-blue-500 dark:bg-blue-400 scale-50" />
    </motion.div>
  );
}

function OrbitVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const { container, dot } = sizeMap[size];
  return (
    <div className={`${container} relative`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`${dot} absolute top-1/2 left-1/2 rounded-full bg-blue-500 dark:bg-blue-400`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'linear',
          }}
          style={{
            originX: '0px',
            originY: '0px',
            x: '-50%',
            y: '-50%',
            rotate: i * 120,
            translateX: '120%',
          }}
        />
      ))}
    </div>
  );
}

export const AiLoader: React.FC<AiLoaderProps> = ({
  variant = 'dots',
  size = 'md',
  label = 'AI is thinking',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {variant === 'dots' && <DotsVariant size={size} />}
      {variant === 'pulse' && <PulseVariant size={size} />}
      {variant === 'orbit' && <OrbitVariant size={size} />}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default AiLoader;
