'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface AITaskItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface AiTaskListProps {
  tasks: AITaskItem[];
  onToggle?: (id: string) => void;
  title?: string;
  showProgress?: boolean;
  className?: string;
}

export function AiTaskList({
  tasks,
  onToggle,
  title = 'Tasks',
  showProgress = true,
  className = '',
}: AiTaskListProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {completedCount}/{tasks.length}
          </span>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div
            className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completedCount} of ${tasks.length} tasks complete`}
          >
            <motion.div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {/* Task list */}
      <ul className="px-4 pb-4 pt-1 space-y-1" aria-label={title}>
        {tasks.map((task) => (
          <li key={task.id}>
            <label
              className={`flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                onToggle ? '' : 'pointer-events-none'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle?.(task.id)}
                disabled={!onToggle}
                className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent dark:bg-neutral-800 cursor-pointer disabled:cursor-default"
                aria-label={task.label}
              />
              <span
                className={`text-sm transition-all ${
                  task.completed
                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {task.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
