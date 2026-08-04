'use client';
import { useState } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface PhotoTabImage {
  src: string;
  alt: string;
}

export interface PhotoTab {
  id: string;
  label: string;
  images: PhotoTabImage[];
}

export interface PhototabProps {
  tabs: PhotoTab[];
  className?: string;
}

export function Phototab({ tabs, className = '' }: PhototabProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  const currentTab = tabs.find((t) => t.id === activeTab);

  if (tabs.length === 0) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 ${className}`}>
        No tabs provided
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="phototab-indicator"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentTab && (
          <motion.div
            key={currentTab.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {currentTab.images.map((image, idx) => (
              <motion.div
                key={`${currentTab.id}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  draggable={false}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Phototab;
