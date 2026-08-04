'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface OrbitingIcon {
  icon: React.ReactNode;
  label: string;
}

export interface CTAOrbitingProps {
  title: string;
  subtitle: string;
  buttonText: string;
  icons: OrbitingIcon[];
  onCtaClick?: () => void;
  className?: string;
}

export function CTAOrbiting({ title, subtitle, buttonText, icons, onCtaClick, className = '' }: CTAOrbitingProps) {
  return (
    <section className={`w-full py-32 bg-white dark:bg-gray-950 overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center px-6 mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">{subtitle}</p>
      </motion.div>

      <div className="relative mx-auto w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
        {/* Orbiting ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700" />

        {/* Orbiting icons */}
        {icons.map((item, i) => (
          <motion.div
            key={i}
            className="absolute w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 15 + i * 2, repeat: Infinity, ease: 'linear' }}
            style={{
              top: '50%',
              left: '50%',
              marginTop: -24,
              marginLeft: -24,
              transformOrigin: `24px ${144 + (i % 2) * 48}px`,
            }}
            title={item.label}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Center button */}
        <button
          onClick={onCtaClick}
          className="relative z-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-purple-500/30 hover:scale-110 transition-transform duration-300"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
