'use client';

import * as React from 'react';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/** Card item for the stack */
export interface CardStackItem {
  id: string;
  content: React.ReactNode;
}

/** Props for ScrollableCardStack */
export interface ScrollableCardStackProps {
  /** Array of card objects */
  cards: CardStackItem[];
  /** Additional CSS classes */
  className?: string;
}

/** Individual card with scroll-linked transforms */
const StackCard: React.FC<{
  card: CardStackItem;
  index: number;
  total: number;
  progress: import('framer-motion').MotionValue<number>;
}> = ({ card, index, total, progress }) => {
  const start = index / total;
  const end = (index + 1) / total;

  const y = useTransform(progress, [start, end], [50 * (total - index), 0]);
  const scale = useTransform(progress, [start, end], [0.9, 1]);
  const rotate = useTransform(
    progress,
    [start, end],
    [(total - index - 1) * -2, 0]
  );

  return (
    <motion.div
      style={{ y, scale, rotate }}
      className="absolute inset-x-0 top-0 w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
    >
      {card.content}
    </motion.div>
  );
};

/**
 * ScrollableCardStack — Cards that start overlapping and fan out as user scrolls.
 * Uses scroll-linked rotation and scale transforms. SSR-safe.
 */
export const ScrollableCardStack: React.FC<ScrollableCardStackProps> = ({
  cards,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[60vh] ${className}`}
    >
      <div className="sticky top-[20vh] mx-auto h-[400px] w-full max-w-lg">
        {cards.map((card, index) => (
          <StackCard
            key={card.id}
            card={card}
            index={index}
            total={cards.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
};

ScrollableCardStack.displayName = 'ScrollableCardStack';
export default ScrollableCardStack;
