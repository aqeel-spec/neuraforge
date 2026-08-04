'use client';
import { useState, useEffect, type ReactNode } from "react";

import { motion, useSpring, useMotionValue } from 'framer-motion';

export interface CursorFollowBgProps {
  color?: string;
  intensity?: number;
  className?: string;
  children?: ReactNode;
}

export function CursorFollowBg({
  color = '#a855f7',
  intensity = 1,
  className = '',
  children,
}: CursorFollowBgProps) {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    setMounted(true);
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  const size = 300 * intensity;

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-950 ${className}`}>
      {mounted && (
        <motion.div
          className="absolute pointer-events-none rounded-full blur-3xl opacity-30 dark:opacity-20"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${color}, transparent)`,
            x: springX,
            y: springY,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export default CursorFollowBg;
