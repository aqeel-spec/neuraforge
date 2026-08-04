'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface Page404Props {
  title?: string;
  message?: string;
  cta: { label: string; href: string };
  className?: string;
}

export function Page404({ title = '404', message = "The page you're looking for doesn't exist.", cta, className = '' }: Page404Props) {
  return (
    <section className={`w-full min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center px-6"
      >
        <motion.h1
          className="text-[120px] md:text-[200px] font-bold leading-none bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent select-none"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {title}
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto">
          {message}
        </p>
        <a
          href={cta.href}
          className="inline-block rounded-full bg-gray-900 dark:bg-white px-8 py-4 text-base font-semibold text-white dark:text-gray-900 shadow-md hover:scale-105 transition-transform duration-300"
        >
          {cta.label}
        </a>
      </motion.div>
    </section>
  );
}
