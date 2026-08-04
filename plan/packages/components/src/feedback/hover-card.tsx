import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface HoverCardProps {
  trigger: ReactNode;
  content: ReactNode;
  openDelay?: number;
  closeDelay?: number;
  className?: string;
}

export function HoverCard({
  trigger,
  content,
  openDelay = 300,
  closeDelay = 200,
  className,
}: HoverCardProps) {
  const [open, setOpen] = useState(false);
  const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    openTimeout.current = setTimeout(() => setOpen(true), openDelay);
  }, [openDelay]);

  const handleClose = useCallback(() => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
      openTimeout.current = null;
    }
    closeTimeout.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  return (
    <div
      className={`relative inline-block ${className ?? ""}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <span
        tabIndex={0}
        className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-md"
      >
        {trigger}
      </span>
      {open ? (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
