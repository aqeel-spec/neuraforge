'use client';

import * as React from 'react';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/** Hero section item */
export interface HeroSectionItem {
  id: string;
  content: React.ReactNode;
  background?: string;
}

/** Props for ScrollableHeroSections */
export interface ScrollableHeroSectionsProps {
  /** Array of hero sections */
  sections: HeroSectionItem[];
  /** Additional CSS classes */
  className?: string;
}

/** Individual hero section with crossfade */
const HeroSection: React.FC<{
  section: HeroSectionItem;
  index: number;
  total: number;
  progress: import('framer-motion').MotionValue<number>;
}> = ({ section, index, total, progress }) => {
  const sectionStart = index / total;
  const sectionEnd = (index + 1) / total;

  const opacity = useTransform(progress, [sectionStart, sectionEnd], [1, 0]);

  return (
    <motion.section
      style={{
        opacity: index < total - 1 ? opacity : 1,
      }}
      className="h-screen w-full snap-start flex items-center justify-center relative"
      aria-label={`Hero section ${index + 1}`}
    >
      {section.background && (
        <div
          className="absolute inset-0 -z-10"
          style={{ background: section.background }}
        />
      )}
      <div className="relative z-10 w-full">{section.content}</div>
    </motion.section>
  );
};

/**
 * ScrollableHeroSections — Full-height hero panels with crossfade on scroll.
 * Each section is 100vh with scroll-snap alignment. SSR-safe.
 */
export const ScrollableHeroSections: React.FC<ScrollableHeroSectionsProps> = ({
  sections,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div
      ref={containerRef}
      className={`snap-y snap-mandatory overflow-y-auto h-screen ${className}`}
    >
      {sections.map((section, index) => (
        <HeroSection
          key={section.id}
          section={section}
          index={index}
          total={sections.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
};

ScrollableHeroSections.displayName = 'ScrollableHeroSections';
export default ScrollableHeroSections;
