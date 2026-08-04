'use client';

import React from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'bars';
  label?: string;
  className?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, { box: string; dot: string; bar: string }> = {
  xs: { box: 'h-4 w-4', dot: 'h-1 w-1', bar: 'h-3 w-0.5' },
  sm: { box: 'h-5 w-5', dot: 'h-1.5 w-1.5', bar: 'h-4 w-1' },
  md: { box: 'h-8 w-8', dot: 'h-2 w-2', bar: 'h-5 w-1' },
  lg: { box: 'h-12 w-12', dot: 'h-3 w-3', bar: 'h-7 w-1.5' },
};

function DefaultSpinner({ size = 'md', className = '' }: { size?: SpinnerProps['size']; className?: string }) {
  const s = sizeMap[size ?? 'md'];
  return (
    <svg
      className={[
        s.box,
        'motion-safe:animate-spin motion-reduce:animate-none',
        className,
      ].join(' ')}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function DotsSpinner({ size = 'md', className = '' }: { size?: SpinnerProps['size']; className?: string }) {
  const s = sizeMap[size ?? 'md'];
  return (
    <span
      className={['inline-flex items-center gap-1', className].join(' ')}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={[
            s.dot,
            'rounded-full bg-current',
            'motion-safe:animate-[bounce-dot_1.4s_ease-in-out_infinite] motion-reduce:animate-none',
          ].join(' ')}
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function BarsSpinner({ size = 'md', className = '' }: { size?: SpinnerProps['size']; className?: string }) {
  const s = sizeMap[size ?? 'md'];
  return (
    <span
      className={['inline-flex items-end gap-0.5', className].join(' ')}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={[
            s.bar,
            'rounded-sm bg-current',
            'motion-safe:animate-[scale-bar_1.2s_ease-in-out_infinite] motion-reduce:animate-none',
          ].join(' ')}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function Spinner({
  size = 'md',
  variant = 'default',
  label = 'Loading',
  className = '',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={['inline-flex items-center justify-center text-slate-600 dark:text-slate-400', className].join(' ')}
    >
      {variant === 'default' && <DefaultSpinner size={size} />}
      {variant === 'dots' && <DotsSpinner size={size} />}
      {variant === 'bars' && <BarsSpinner size={size} />}
      {/* Screen-reader only text */}
      <span className="sr-only">{label}</span>
    </span>
  );
}

Spinner.displayName = 'Spinner';

export { Spinner };
export default Spinner;
