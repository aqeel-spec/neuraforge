'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

export interface LoginSplitProps {
  title: string;
  logo?: React.ReactNode;
  onSubmit?: (data: { email: string; password: string }) => void;
  className?: string;
}

export function LoginSplit({ title, logo, onSubmit, className = '' }: LoginSplitProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <section className={`w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 ${className}`}>
      {/* Form side */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-center px-6 py-16 bg-white dark:bg-gray-950"
      >
        <div className="w-full max-w-md">
          {logo && <div className="mb-8">{logo}</div>}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Welcome back. Sign in to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
            <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 text-white font-semibold hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </form>
        </div>
      </motion.div>

      {/* Branding side */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 p-16"
      >
        <div className="text-center text-white max-w-md">
          <h2 className="text-4xl font-bold mb-4">Build something amazing</h2>
          <p className="text-lg text-white/80">Join thousands of developers shipping faster with our platform.</p>
        </div>
      </motion.div>
    </section>
  );
}
