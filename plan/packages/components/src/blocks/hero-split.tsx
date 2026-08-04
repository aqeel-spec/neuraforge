'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface HeroSplitProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  imageSrc: string;
  className?: string;
}

export function HeroSplit({ title, subtitle, cta, imageSrc, className = '' }: HeroSplitProps) {
  return (
    <section className={`w-full min-h-screen flex items-center bg-white dark:bg-gray-950 ${className}`}>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 md:px-16 py-20">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col justify-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            {title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
            {subtitle}
          </p>
          <a
            href={cta.href}
            className="inline-block w-fit rounded-lg bg-gray-900 dark:bg-white px-8 py-4 text-base font-semibold text-white dark:text-gray-900 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            {cta.label}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <img
            src={imageSrc}
            alt=""
            className="w-full h-auto max-h-[600px] object-cover rounded-2xl shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
