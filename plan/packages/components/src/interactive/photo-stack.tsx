'use client';
import { useState } from "react";

import { motion, AnimatePresence, type PanInfo } from 'framer-motion';

export interface PhotoStackImage {
  src: string;
  alt: string;
}

export interface PhotoStackProps {
  images: PhotoStackImage[];
  onSwipe?: (dir: 'left' | 'right', idx: number) => void;
  className?: string;
}

export function PhotoStack({ images, onSwipe, className = '' }: PhotoStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('right');

  const visibleImages = images.slice(currentIndex, currentIndex + 3);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setExitDirection(direction);
      onSwipe?.(direction, currentIndex);
      setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
    }
  };

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 ${className}`}>
        No images
      </div>
    );
  }

  return (
    <div className={`relative w-72 h-96 ${className}`}>
      <AnimatePresence>
        {visibleImages.map((image, stackIndex) => {
          const absoluteIndex = currentIndex + stackIndex;
          const isTop = stackIndex === 0;

          return (
            <motion.div
              key={absoluteIndex}
              className="absolute inset-0 rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              style={{
                zIndex: visibleImages.length - stackIndex,
                cursor: isTop ? 'grab' : 'default',
              }}
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{
                scale: 1 - stackIndex * 0.05,
                y: stackIndex * 8,
                opacity: 1 - stackIndex * 0.15,
                rotateZ: 0,
              }}
              exit={{
                x: exitDirection === 'right' ? 300 : -300,
                opacity: 0,
                rotateZ: exitDirection === 'right' ? 15 : -15,
                transition: { duration: 0.3 },
              }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={isTop ? handleDragEnd : undefined}
              whileDrag={{ cursor: 'grabbing' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
        {Math.min(currentIndex + 1, images.length)} / {images.length}
      </div>
    </div>
  );
}

export default PhotoStack;
