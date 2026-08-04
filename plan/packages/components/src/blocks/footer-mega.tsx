'use client';

import { motion } from 'framer-motion';
import React from 'react';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterMegaProps {
  columns: FooterColumn[];
  newsletter?: boolean;
  socials?: { icon: React.ReactNode; href: string }[];
  className?: string;
}

export function FooterMega({ columns, newsletter, socials, className = '' }: FooterMegaProps) {
  return (
    <footer className={`w-full bg-gray-900 dark:bg-gray-950 py-16 px-6 md:px-16 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {newsletter && (
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Newsletter</h4>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="flex-1 rounded-lg px-4 py-2 bg-gray-800 text-white text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
                <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white font-medium hover:bg-purple-500 transition-colors">
                  Join
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} All rights reserved.</p>
          {socials && (
            <div className="flex gap-4">
              {socials.map((s, i) => (
                <a key={i} href={s.href} className="text-gray-400 hover:text-white transition-colors text-xl">
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </footer>
  );
}
