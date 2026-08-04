'use client';

import { motion } from 'framer-motion';
import React, { useRef } from 'react';

export interface CarouselMember {
  name: string;
  role: string;
  photo: string;
}

export interface TeamCarouselProps {
  members: CarouselMember[];
  className?: string;
}

export function TeamCarousel({ members, className = '' }: TeamCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <section className={`w-full py-24 bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 px-6"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">Our Team</h2>
      </motion.div>

      <div className="relative px-6 md:px-16">
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {members.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="min-w-[260px] snap-center flex-shrink-0 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 text-center"
            >
              <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{m.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{m.role}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            ←
          </button>
          <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            →
          </button>
        </div>
      </div>
    </section>
  );
}
