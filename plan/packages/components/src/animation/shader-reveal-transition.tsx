'use client';

import * as React from 'react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/** Props for ShaderRevealTransition */
export interface ShaderRevealTransitionProps {
  /** Content to reveal */
  children: React.ReactNode;
  /** Direction of the clip-path reveal */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Additional CSS classes */
  className?: string;
}

/** Get clip-path polygons for hidden and revealed states */
function getClipPaths(direction: 'left' | 'right' | 'up' | 'down'): {
  hidden: string;
  visible: string;
} {
  switch (direction) {
    case 'left':
      return {
        hidden: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
        visible: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'right':
      return {
        hidden: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
        visible: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'up':
      return {
        hidden: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        visible: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    case 'down':
      return {
        hidden: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        visible: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
    default:
      return {
        hidden: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
        visible: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
  }
}

/**
 * ShaderRevealTransition — Clip-path polygon reveal triggered on viewport intersection.
 * Animates clip-path from collapsed to full rectangle. Uses useInView. SSR-safe.
 */
export const ShaderRevealTransition: React.FC<ShaderRevealTransitionProps> = ({
  children,
  direction = 'left',
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  const { hidden, visible } = getClipPaths(direction);

  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: hidden }}
      animate={{ clipPath: isInView ? visible : hidden }}
      transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

ShaderRevealTransition.displayName = 'ShaderRevealTransition';
export default ShaderRevealTransition;
