'use client';

import { motion } from 'framer-motion';

export interface MorphSurfaceProps {
  colors?: string[];
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const speedMap = { slow: 12, medium: 6, fast: 3 };

const blobPaths = [
  'M44.5,20 C54,11 70,18 72,30 C74,42 63,55 50,56 C37,57 25,48 24,36 C23,24 35,29 44.5,20 Z',
  'M50,15 C65,12 78,25 75,40 C72,55 58,62 45,58 C32,54 22,42 25,28 C28,14 35,18 50,15 Z',
  'M40,22 C52,10 72,15 74,32 C76,49 62,60 48,58 C34,56 20,46 22,32 C24,18 28,34 40,22 Z',
];

export function MorphSurface({
  colors = ['#a855f7', '#3b82f6', '#06b6d4'],
  speed = 'medium',
  className = '',
}: MorphSurfaceProps) {
  const dur = speedMap[speed];

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 100 70"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="morph-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0] ?? '#a855f7'} />
            <stop offset="50%" stopColor={colors[1] ?? '#3b82f6'} />
            <stop offset="100%" stopColor={colors[2] ?? '#06b6d4'} />
          </linearGradient>
        </defs>
        {blobPaths.map((_, i) => (
          <motion.path
            key={i}
            fill="url(#morph-grad-1)"
            fillOpacity={0.5 - i * 0.1}
            animate={{ d: blobPaths }}
            transition={{
              duration: dur + i,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
            d={blobPaths[i]}
          />
        ))}
      </svg>
    </div>
  );
}

export default MorphSurface;
