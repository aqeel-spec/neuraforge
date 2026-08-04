'use client';
import { type ReactNode } from "react";

import { motion, useReducedMotion } from 'framer-motion';

export interface BeamsBackgroundProps {
  color?: string;
  beamCount?: number;
  className?: string;
  children?: ReactNode;
}

export function BeamsBackground({
  color = '#a855f7',
  beamCount = 6,
  className = '',
  children,
}: BeamsBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();
  const beams = Array.from({ length: beamCount }, (_, i) => i);

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-950 ${className}`}>
      {/* Beams layer */}
      <div className="absolute inset-0 pointer-events-none">
        {beams.map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from ${(360 / beamCount) * i}deg at 50% 50%, transparent 0deg, ${color}20 2deg, transparent 4deg)`,
            }}
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={{
              duration: 20 + i * 3,
              repeat: shouldReduceMotion ? 0 : Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
      {/* Children on top */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export default BeamsBackground;
