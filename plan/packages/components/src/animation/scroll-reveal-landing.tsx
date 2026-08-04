'use client';

import * as React from 'react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/** Section item for the landing page */
export interface LandingSectionItem {
  id: string;
  content: React.ReactNode;
}

/** Props for ScrollRevealLanding */
export interface ScrollRevealLandingProps {
  /** Array of landing page sections */
  sections: LandingSectionItem[];
  /** Additional CSS classes */
  className?: string;
}

/** Individual section that fades up when entering the viewport */
const RevealSection: React.FC<{
  section: LandingSectionItem;
  index: number;
}> = ({ section, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.1,
      }}
      className="w-full"
      aria-label={`Section ${index + 1}`}
    >
      {section.content}
    </motion.section>
  );
};

/**
 * ScrollRevealLanding — Landing page container where each section fades up
 * when entering the viewport with staggered timing. Uses useInView. SSR-safe.
 */
export const ScrollRevealLanding: React.FC<ScrollRevealLandingProps> = ({
  sections,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-16 ${className}`}>
      {sections.map((section, index) => (
        <RevealSection key={section.id} section={section} index={index} />
      ))}
    </div>
  );
};

ScrollRevealLanding.displayName = 'ScrollRevealLanding';
export default ScrollRevealLanding;
