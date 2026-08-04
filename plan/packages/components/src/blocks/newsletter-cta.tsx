'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

export interface NewsletterCTAProps {
  title: string;
  description: string;
  onSubmit?: (email: string) => void;
  className?: string;
}

export function NewsletterCTA({ title, description, onSubmit, className = '' }: NewsletterCTAProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email);
    setEmail('');
  };

  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{title}</h2>
        <p className="text-lg text-white/80 mb-10">{description}</p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 rounded-xl px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-white px-8 py-4 font-semibold text-purple-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-6 text-sm text-white/60">
          Join 10,000+ subscribers. No spam, unsubscribe anytime.
        </p>
      </motion.div>
    </section>
  );
}
