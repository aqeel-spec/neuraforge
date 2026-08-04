'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export interface HeroAnimatedProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  className?: string;
}

export function HeroAnimated({ title, subtitle, cta, className = '' }: HeroAnimatedProps) {
  const shouldReduceMotion = useReducedMotion();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 4,
  }));

  return (
    <section className={`relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-950 ${className}`}>
      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-purple-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={shouldReduceMotion ? {} : { y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 px-6 text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <a
          href={cta.href}
          className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {cta.label}
        </a>
      </motion.div>
    </section>
  );
}
