'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface BlogPost {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  href: string;
}

export interface BlogGridProps {
  posts: BlogPost[];
  className?: string;
}

export function BlogGrid({ posts, className = '' }: BlogGridProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">Latest Posts</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {posts.map((post, i) => (
          <motion.a
            key={i}
            href={post.href}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{post.excerpt}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
