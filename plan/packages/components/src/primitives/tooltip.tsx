'use client';

import React, {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
} from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

const positionClasses: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-100 border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-100 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-100 border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-100 border-y-transparent border-l-transparent',
};

function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hide();
      }
    };

    const handleScroll = () => {
      hide();
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [visible, hide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </span>

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            'absolute z-50 max-w-xs whitespace-normal break-words rounded-md px-3 py-1.5 text-xs font-medium shadow-lg',
            'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
            'motion-safe:animate-[tooltip-enter_150ms_ease-out] motion-reduce:animate-none',
            positionClasses[side],
            className,
          ].join(' ')}
        >
          {content}
          {/* Arrow */}
          <span
            className={[
              'absolute h-0 w-0 border-4',
              arrowClasses[side],
            ].join(' ')}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export default Tooltip;
