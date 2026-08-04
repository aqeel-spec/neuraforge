'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface HeroMinimalProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  className?: string;
}

export function HeroMinimal({ title, subtitle, cta, className = '' }: HeroMinimalProps) {
  return (
    <section className={`w-full min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="px-6 text-center max-w-3xl mx-auto py-32"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 leading-relaxed">
          {subtitle}
        </p>
        <a
          href={cta.href}
          className="inline-block border-2 border-gray-900 dark:border-white rounded-full px-10 py-4 text-lg font-medium text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all duration-300"
        >
          {cta.label}
        </a>
      </motion.div>
    </section>
  );
}
