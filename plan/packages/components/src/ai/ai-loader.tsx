'use client';

import { motion } from 'framer-motion';

export interface AiLoaderProps {
  variant?: 'dots' | 'pulse' | 'orbit';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizes = {
  sm: { wrapper: 'w-16 h-10', dot: 6, pulse: 32, orbit: 40 },
  md: { wrapper: 'w-20 h-14', dot: 8, pulse: 48, orbit: 56 },
  lg: { wrapper: 'w-28 h-20', dot: 10, pulse: 64, orbit: 72 },
} as const;

function DotsVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500 shadow-lg shadow-violet-500/25"
          style={{ width: s.dot, height: s.dot }}
          animate={{
            y: [0, -12, 0],
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </div>
  );
}

function PulseVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = sizes[size];
  return (
    <div className="relative flex items-center justify-center" style={{ width: s.pulse, height: s.pulse }}>
      {/* Outer ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-violet-500/40 dark:border-violet-400/40"
          animate={{
            scale: [1, 2.2],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
      {/* Core orb */}
      <motion.div
        className="relative rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-purple-500 shadow-xl shadow-violet-500/40"
        style={{ width: s.pulse * 0.5, height: s.pulse * 0.5 }}
        animate={{
          scale: [1, 1.15, 1],
          boxShadow: [
            '0 0 0 0 rgba(139, 92, 246, 0.4)',
            '0 0 20px 4px rgba(139, 92, 246, 0.3)',
            '0 0 0 0 rgba(139, 92, 246, 0.4)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function OrbitVariant({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = sizes[size];
  const radius = s.orbit * 0.38;
  return (
    <div className="relative flex items-center justify-center" style={{ width: s.orbit, height: s.orbit }}>
      {/* Center dot */}
      <div className="absolute w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 shadow-md shadow-violet-500/50" />
      {/* Orbit track */}
      <div
        className="absolute rounded-full border border-violet-500/20 dark:border-violet-400/20"
        style={{ width: radius * 2, height: radius * 2 }}
      />
      {/* Orbiting particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full shadow-md"
          style={{
            width: s.dot * 0.8,
            height: s.dot * 0.8,
            background: i % 2 === 0
              ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
              : 'linear-gradient(135deg, #a78bfa, #818cf8)',
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI) / 2) * radius,
              Math.cos((i * Math.PI) / 2 + Math.PI / 2) * radius,
              Math.cos((i * Math.PI) / 2 + Math.PI) * radius,
              Math.cos((i * Math.PI) / 2 + (3 * Math.PI) / 2) * radius,
              Math.cos((i * Math.PI) / 2 + 2 * Math.PI) * radius,
            ],
            y: [
              Math.sin((i * Math.PI) / 2) * radius,
              Math.sin((i * Math.PI) / 2 + Math.PI / 2) * radius,
              Math.sin((i * Math.PI) / 2 + Math.PI) * radius,
              Math.sin((i * Math.PI) / 2 + (3 * Math.PI) / 2) * radius,
              Math.sin((i * Math.PI) / 2 + 2 * Math.PI) * radius,
            ],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

export const AiLoader = ({
  variant = 'dots',
  size = 'md',
  label = 'AI is thinking',
  className = '',
}: AiLoaderProps) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${sizes[size].wrapper} ${className}`}
    >
      {variant === 'dots' && <DotsVariant size={size} />}
      {variant === 'pulse' && <PulseVariant size={size} />}
      {variant === 'orbit' && <OrbitVariant size={size} />}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default AiLoader;
