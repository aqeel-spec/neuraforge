'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface TestimonialMarqueeProps {
  testimonials: Testimonial[];
  className?: string;
}

export function TestimonialMarquee({ testimonials, className = '' }: TestimonialMarqueeProps) {
  const shouldReduceMotion = useReducedMotion();
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className={`w-full py-24 bg-gray-50 dark:bg-gray-900 overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center px-6"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">What people say</h2>
      </motion.div>

      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex gap-6 whitespace-nowrap"
          animate={shouldReduceMotion ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'linear' }}
        >
          {doubled.map((t, i) => (
            <div
              key={i}
              className="inline-flex flex-col w-[280px] sm:w-[320px] md:w-[380px] shrink-0 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <p className="text-gray-700 dark:text-gray-300 whitespace-normal text-sm leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                {t.avatar && (
                  <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.author}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
