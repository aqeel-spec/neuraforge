'use client';
import { useEffect, useRef } from "react";

import { motion, useMotionValue, useSpring } from 'framer-motion';

export interface CursorFollowProps {
  children: React.ReactNode;
  offset?: number;
  magnetic?: boolean;
  className?: string;
}

export function CursorFollow({
  children,
  offset = 0,
  magnetic = false,
  className = '',
}: CursorFollowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (magnetic && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        const magneticRadius = 150;

        if (distance < magneticRadius) {
          const pull = 1 - distance / magneticRadius;
          mouseX.set(distX * pull + offset);
          mouseY.set(distY * pull + offset);
        } else {
          mouseX.set(0);
          mouseY.set(0);
        }
      } else {
        if (ref.current) {
          const rect = ref.current.parentElement?.getBoundingClientRect();
          if (rect) {
            mouseX.set(e.clientX - rect.left - rect.width / 2 + offset);
            mouseY.set(e.clientY - rect.top - rect.height / 2 + offset);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [magnetic, offset, mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default CursorFollow;
