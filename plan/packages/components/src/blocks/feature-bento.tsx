'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface BentoFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface FeatureBentoProps {
  features: BentoFeature[];
  className?: string;
}

export function FeatureBento({ features, className = '' }: FeatureBentoProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {features.map((feature, i) => {
          const isLarge = i === 0 || i === 3;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`rounded-2xl p-8 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 ${
                isLarge ? 'md:col-span-2' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl mb-5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
