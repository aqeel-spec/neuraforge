'use client';

import React from 'react';

export interface ListItem {
  /** Unique identifier */
  id: string;
  /** Primary text */
  label: string;
  /** Optional secondary text */
  description?: string;
  /** Optional icon (ReactNode) */
  icon?: React.ReactNode;
  /** Optional action element (button/link) */
  action?: React.ReactNode;
}

export interface ListProps {
  /** Array of list items */
  items: ListItem[];
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'striped';
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<NonNullable<ListProps['variant']>, { container: string; item: string }> = {
  default: {
    container: '',
    item: 'border-b border-gray-200 dark:border-gray-700 last:border-b-0',
  },
  bordered: {
    container: 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
    item: 'border-b border-gray-200 dark:border-gray-700 last:border-b-0',
  },
  striped: {
    container: 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
    item: 'even:bg-gray-50 dark:even:bg-gray-800/50',
  },
};

/**
 * List — A structured list component supporting icons, descriptions, and action buttons.
 *
 * Renders semantic <ul>/<li> elements with proper keyboard accessibility.
 * All action elements remain focusable via Tab key.
 */
export const List: React.FC<ListProps> = ({
  items,
  variant = 'default',
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <ul
      role="list"
      className={`${styles.container} ${className}`}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-center gap-3 px-4 py-3 ${styles.item}`}
        >
          {/* Icon */}
          {item.icon && (
            <span
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            >
              {item.icon}
            </span>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {item.label}
            </p>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {item.description}
              </p>
            )}
          </div>

          {/* Action */}
          {item.action && (
            <div className="flex-shrink-0">
              {item.action}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default List;
