'use client';
import { type ReactNode } from "react";

import { motion } from 'framer-motion';

export interface BrandingAgentProps {
  name: string;
  role: string;
  avatar?: ReactNode;
  capabilities?: string[];
  className?: string;
}

export function BrandingAgent({ name, role, avatar, capabilities = [], className = '' }: BrandingAgentProps) {
  return (
    <motion.div
      className={`relative p-[2px] rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center gap-4 mb-4">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
          </div>
        </div>
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {capabilities.map((cap) => (
              <span
                key={cap}
                className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/40 dark:to-blue-900/40 dark:text-purple-300"
              >
                {cap}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default BrandingAgent;
