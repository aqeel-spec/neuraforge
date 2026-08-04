'use client';
import { useState, useEffect, useCallback } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface TourStep {
  target: string;
  title: string;
  content: string;
}

export interface TourProps {
  steps: TourStep[];
  active: boolean;
  currentStep?: number;
  onNext?: () => void;
  onClose?: () => void;
  className?: string;
}

export function Tour({ steps, active, currentStep, onNext, onClose, className = '' }: TourProps) {
  const [internalStep, setInternalStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const step = currentStep ?? internalStep;
  const current = steps[step];

  const updatePosition = useCallback(() => {
    if (!current || typeof document === 'undefined') return;
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.bottom + 12, left: rect.left });
    }
  }, [current]);

  useEffect(() => {
    if (!active) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [active, updatePosition]);

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (step < steps.length - 1) {
      setInternalStep((s) => s + 1);
    } else {
      onClose?.();
    }
  };

  if (!active || !current) return null;

  return (
    <AnimatePresence>
      <div className={className}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[999]" onClick={onClose} />
        {/* Tooltip */}
        {position && (
          <motion.div
            className="fixed z-[1000] w-72 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl"
            style={{ top: position.top, left: position.left }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{current.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{current.content}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {step + 1} / {steps.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="px-2.5 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600"
                >
                  {step < steps.length - 1 ? 'Next' : 'Done'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

export default Tour;
