'use client';
import { useState, useRef, useCallback } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface ImageZoomProps {
  src: string;
  alt: string;
  zoomScale?: number;
  className?: string;
}

export function ImageZoom({
  src,
  alt,
  zoomScale = 2,
  className = '',
}: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLensPosition({ x, y });
    },
    []
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden cursor-zoom-in rounded-lg ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        aria-label={`Zoom image: ${alt}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setLightbox(true);
          }
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: `${zoomScale * 100}%`,
              backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setLightbox(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setLightbox(false);
            }}
          >
            <motion.img
              src={src}
              alt={alt}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ImageZoom;
