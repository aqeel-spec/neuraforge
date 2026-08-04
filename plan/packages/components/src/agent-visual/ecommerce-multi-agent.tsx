'use client';
import { Fragment } from "react";

import { motion } from 'framer-motion';

export interface AgentNode {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'complete';
}

export interface EcommerceMultiAgentProps {
  agents: AgentNode[];
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400',
  idle: 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600',
  complete: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400',
};

const statusDot: Record<string, string> = {
  active: 'bg-green-500',
  idle: 'bg-gray-400',
  complete: 'bg-blue-500',
};

export function EcommerceMultiAgent({ agents, className = '' }: EcommerceMultiAgentProps) {
  return (
    <div className={`relative flex flex-wrap items-center justify-center gap-6 p-6 ${className}`}>
      {agents.map((agent, i) => (
        <Fragment key={agent.id}>
          <motion.div
            className={`relative border-2 rounded-xl p-4 min-w-[140px] text-center ${statusStyles[agent.status]}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <motion.span
                className={`w-2.5 h-2.5 rounded-full ${statusDot[agent.status]}`}
                animate={agent.status === 'active' ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                {agent.status}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{agent.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{agent.role}</p>
          </motion.div>
          {/* Connector line */}
          {i < agents.length - 1 && (
            <motion.div
              className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 rounded"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15 + 0.1 }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export default EcommerceMultiAgent;
