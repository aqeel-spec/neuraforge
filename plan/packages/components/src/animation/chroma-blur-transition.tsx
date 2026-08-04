'use client';

import * as React from 'react';

/** Props for ChromaBlurTransition */
export interface ChromaBlurTransitionProps {
  /** Starting gradient color (default: 'rgba(99,102,241,0.5)') */
  fromColor?: string;
  /** Ending gradient color (default: 'rgba(168,85,247,0.5)') */
  toColor?: string;
  /** Height in pixels (default: 200) */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChromaBlurTransition — A color blur divider between sections.
 * Uses backdrop-blur and gradient overlays for a chromatic blending effect.
 * Respects dark mode and prefers-reduced-motion. SSR-safe.
 */
export const ChromaBlurTransition: React.FC<ChromaBlurTransitionProps> = ({
  fromColor = 'rgba(99,102,241,0.5)',
  toColor = 'rgba(168,85,247,0.5)',
  height = 200,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
      role="separator"
    >
      {/* Gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
        }}
      />
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-xl" />
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white dark:from-neutral-900 to-transparent" />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
    </div>
  );
};

ChromaBlurTransition.displayName = 'ChromaBlurTransition';
export default ChromaBlurTransition;
