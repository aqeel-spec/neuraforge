'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface FeatureCardItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface FeatureCardsProps {
  features: FeatureCardItem[];
  className?: string;
}

export function FeatureCards({ features, className = '' }: FeatureCardsProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
