'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio: string;
}

export interface AboutTeamProps {
  title: string;
  description: string;
  members: TeamMember[];
  className?: string;
}

export function AboutTeam({ title, description, members, className = '' }: AboutTeamProps) {
  return (
    <section className={`w-full py-24 px-6 md:px-16 bg-white dark:bg-gray-950 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-3xl mx-auto"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {members.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 text-center hover:shadow-lg transition-shadow duration-300"
          >
            <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{m.name}</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">{m.role}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{m.bio}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
