'use client';

import * as React from 'react';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/** Props for ScrollRevealParagraph */
export interface ScrollRevealParagraphProps {
  /** Text content to reveal word by word */
  text: string;
  /** Additional CSS classes */
  className?: string;
}

/** Individual word with scroll-linked opacity */
const RevealWord: React.FC<{
  word: string;
  range: [number, number];
  progress: import('framer-motion').MotionValue<number>;
}> = ({ word, range, progress }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className="inline-block mr-[0.25em] text-inherit dark:text-inherit"
    >
      {word}
    </motion.span>
  );
};

/**
 * ScrollRevealParagraph — Reveals text word-by-word as user scrolls.
 * Each word transitions from opacity 0.2 to 1 based on scroll progress.
 * Uses useScroll + useTransform for smooth scroll-linked animation. SSR-safe.
 */
export const ScrollRevealParagraph: React.FC<ScrollRevealParagraphProps> = ({
  text,
  className = '',
}) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'start 0.25'],
  });

  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  return (
    <p
      ref={containerRef}
      className={`text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 ${className}`}
    >
      {words.map((word, i) => {
        const start = i / totalWords;
        const end = (i + 1) / totalWords;
        return (
          <RevealWord
            key={`${word}-${i}`}
            word={word}
            range={[start, end]}
            progress={scrollYProgress}
          />
        );
      })}
    </p>
  );
};

ScrollRevealParagraph.displayName = 'ScrollRevealParagraph';
export default ScrollRevealParagraph;
