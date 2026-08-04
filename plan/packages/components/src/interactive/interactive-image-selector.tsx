'use client';
import { useState } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface ImageRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface InteractiveImageSelectorProps {
  src: string;
  alt: string;
  regions: ImageRegion[];
  onSelect?: (id: string) => void;
  className?: string;
}

export function InteractiveImageSelector({
  src,
  alt,
  regions,
  onSelect,
  className = '',
}: InteractiveImageSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block rounded-lg"
        draggable={false}
      />

      {/* Hotspot overlays */}
      {regions.map((region) => {
        const isHovered = hoveredId === region.id;
        const isSelected = selectedId === region.id;

        return (
          <motion.div
            key={region.id}
            className={`absolute cursor-pointer border-2 rounded transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-500/20'
                : isHovered
                ? 'border-blue-400 bg-blue-400/15'
                : 'border-transparent bg-white/5 hover:border-blue-300'
            }`}
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.width}%`,
              height: `${region.height}%`,
            }}
            onMouseEnter={() => setHoveredId(region.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleSelect(region.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            aria-label={region.label}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(region.id);
              }
            }}
          >
            {/* Label tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium whitespace-nowrap shadow-lg z-10"
                >
                  {region.label}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export default InteractiveImageSelector;
