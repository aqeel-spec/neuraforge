'use client';

import * as React from 'react';

/** Props for InfiniteSlider */
export interface InfiniteSliderProps {
  /** Content to scroll infinitely */
  children: React.ReactNode;
  /** Animation speed in pixels per second (default: 40) */
  speed?: number;
  /** Scroll direction */
  direction?: 'left' | 'right';
  /** Pause animation on hover */
  pauseOnHover?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InfiniteSlider — Auto-scrolling strip that duplicates children for a seamless loop.
 * Uses CSS keyframe animation with motion-safe media query. SSR-safe.
 */
export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  children,
  speed = 40,
  direction = 'left',
  pauseOnHover = false,
  className = '',
}) => {
  const duration = `${100 / (speed / 40)}s`;
  const animationDirection = direction === 'right' ? 'reverse' : 'normal';

  return (
    <div
      className={`overflow-hidden relative w-full ${className}`}
      aria-hidden="true"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes neuraforge-infinite-slide {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `,
        }}
      />
      <div
        className={`flex w-max motion-safe:animate-[neuraforge-infinite-slide] ${
          pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
        }`}
        style={{
          animationDuration: duration,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDirection: animationDirection,
          animationName: 'neuraforge-infinite-slide',
        }}
      >
        {/* Original children */}
        <div className="flex shrink-0">{children}</div>
        {/* Duplicate for seamless loop */}
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};

InfiniteSlider.displayName = 'InfiniteSlider';
export default InfiniteSlider;
