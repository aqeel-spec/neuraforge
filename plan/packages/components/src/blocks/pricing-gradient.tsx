'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}

export interface PricingGradientProps {
  plans: PricingPlan[];
  className?: string;
}

export function PricingGradient({ plans, className = '' }: PricingGradientProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Pricing</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Choose the plan that fits your needs</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative rounded-2xl p-[2px] ${
              plan.popular
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 h-full flex flex-col">
              {plan.popular && (
                <span className="inline-block self-start text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full mb-4">
                  Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">{plan.price}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full rounded-xl py-3 font-semibold transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
                Get started
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
