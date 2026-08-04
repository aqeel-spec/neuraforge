'use client';
import { useState } from "react";

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';

export interface PowerOffSlideProps {
  onConfirm: () => void;
  label?: string;
  className?: string;
}

export function PowerOffSlide({
  onConfirm,
  label = 'Slide to confirm',
  className = '',
}: PowerOffSlideProps) {
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);
  const trackWidth = 280;
  const thumbSize = 48;
  const maxDrag = trackWidth - thumbSize - 8;

  const fillWidth = useTransform(x, [0, maxDrag], ['0%', '100%']);
  const labelOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);

  const handleDragEnd = (_: unknown, _info: PanInfo) => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.85) {
      setConfirmed(true);
      onConfirm();
    }
  };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: trackWidth }}
    >
      <div className="relative h-14 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-gray-300 dark:border-gray-700">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-green-500/30 dark:bg-green-400/20 rounded-full"
          style={{ width: fillWidth }}
        />

        {/* Label */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 pointer-events-none"
          style={{ opacity: labelOpacity }}
        >
          {label}
        </motion.span>

        {/* Thumb */}
        <motion.div
          drag={confirmed ? false : 'x'}
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="absolute top-1 left-1 w-12 h-12 rounded-full bg-white dark:bg-gray-200 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.95 }}
          animate={confirmed ? { x: maxDrag } : undefined}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

export default PowerOffSlide;
