'use client';
import { useState, useEffect } from "react";

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface SubAgentStarterProps {
  agentName: string;
  onReady?: () => void;
  className?: string;
}

const stages = ['Initializing…', 'Loading modules…', 'Connecting…', 'Ready'];

export function SubAgentStarter({ agentName, onReady, className = '' }: SubAgentStarterProps) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 25 && stage < 1) setStage(1);
    if (progress >= 60 && stage < 2) setStage(2);
    if (progress >= 100 && stage < 3) {
      setStage(3);
      onReady?.();
    }
  }, [progress, stage, onReady]);

  return (
    <div className={`w-full max-w-sm p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <AnimatePresence mode="wait">
          {stage < 3 ? (
            <motion.div
              key="loading"
              className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: shouldReduceMotion ? 0 : 360 }}
              transition={{ duration: 1, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'linear' }}
            />
          ) : (
            <motion.div
              key="done"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        <span className="font-semibold text-gray-900 dark:text-white text-sm">{agentName}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {stages[stage]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default SubAgentStarter;
