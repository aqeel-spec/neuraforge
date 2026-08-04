'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface HeroVideoProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  videoSrc: string;
  poster?: string;
  className?: string;
}

export function HeroVideo({ title, subtitle, cta, videoSrc, poster, className = '' }: HeroVideoProps) {
  return (
    <section className={`relative w-full min-h-screen flex items-center justify-center overflow-hidden ${className}`}>
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 px-6 text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <a
          href={cta.href}
          className="inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {cta.label}
        </a>
      </motion.div>
    </section>
  );
}
