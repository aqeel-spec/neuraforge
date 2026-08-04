'use client';
import { useState, useEffect, useCallback } from "react";

import { motion, AnimatePresence } from 'framer-motion';

export interface ExpandableCard {
  id: string;
  title: string;
  preview: React.ReactNode;
  content: React.ReactNode;
}

export interface ExpandableCardsProps {
  cards: ExpandableCard[];
  className?: string;
}

export function ExpandableCards({ cards, className = '' }: ExpandableCardsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    if (selectedId) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedId, handleClose]);

  const selectedCard = cards.find((c) => c.id === selectedId);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            layoutId={`card-${card.id}`}
            onClick={() => setSelectedId(card.id)}
            className="cursor-pointer rounded-xl bg-white dark:bg-gray-800 p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            whileHover={{ y: -2 }}
          >
            <motion.h3
              layoutId={`title-${card.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              {card.title}
            </motion.h3>
            <motion.div layoutId={`preview-${card.id}`}>
              {card.preview}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && selectedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                layoutId={`card-${selectedId}`}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.h3
                  layoutId={`title-${selectedId}`}
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
                >
                  {selectedCard.title}
                </motion.h3>
                <motion.div layoutId={`preview-${selectedId}`} className="mb-4">
                  {selectedCard.preview}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-700 dark:text-gray-300"
                >
                  {selectedCard.content}
                </motion.div>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Close"
                >
                  Close
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpandableCards;
