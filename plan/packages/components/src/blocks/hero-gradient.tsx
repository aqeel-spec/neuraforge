'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface HeroGradientProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  className?: string;
}

export function HeroGradient({ title, subtitle, cta, className = '' }: HeroGradientProps) {
  return (
    <section className={`relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-white dark:bg-gray-950 ${className}`}>
      {/* Gradient mesh blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl animate-pulse delay-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 px-6 text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <a
          href={cta.href}
          className="inline-block rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {cta.label}
        </a>
      </motion.div>
    </section>
  );
}
