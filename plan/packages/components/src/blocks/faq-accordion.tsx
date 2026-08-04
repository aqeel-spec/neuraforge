'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  title: string;
  items: FAQItem[];
  searchable?: boolean;
  className?: string;
}

export function FAQAccordion({ title, items, searchable, className = '' }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filtered = query
    ? items.filter((it) => it.question.toLowerCase().includes(query.toLowerCase()) || it.answer.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white text-center mb-8">{title}</h2>

        {searchable && (
          <input
            type="text"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl px-5 py-3 mb-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
          />
        )}

        <div className="space-y-3">
          {filtered.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                {item.question}
                <span className="text-xl ml-4">{openIndex === i ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
