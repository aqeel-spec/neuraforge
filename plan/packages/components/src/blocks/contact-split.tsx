'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface ContactSplitProps {
  title: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  className?: string;
}

export function ContactSplit({ title, description, email, phone, address, className = '' }: ContactSplitProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{description}</p>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Your email"
              className="w-full rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
            <textarea
              rows={4}
              placeholder="Your message"
              className="w-full rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none"
            />
            <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 text-white font-semibold hover:opacity-90 transition-opacity">
              Send Message
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col justify-center space-y-8"
        >
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Email</h4>
            <p className="text-lg text-gray-900 dark:text-white">{email}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Phone</h4>
            <p className="text-lg text-gray-900 dark:text-white">{phone}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Address</h4>
            <p className="text-lg text-gray-900 dark:text-white">{address}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
