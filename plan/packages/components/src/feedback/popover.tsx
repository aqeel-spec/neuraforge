'use client';

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}

const sidePositionClasses: Record<string, string> = {
  "top-start": "bottom-full left-0 mb-2",
  "top-center": "bottom-full left-1/2 -translate-x-1/2 mb-2",
  "top-end": "bottom-full right-0 mb-2",
  "bottom-start": "top-full left-0 mt-2",
  "bottom-center": "top-full left-1/2 -translate-x-1/2 mt-2",
  "bottom-end": "top-full right-0 mt-2",
  "left-start": "right-full top-0 mr-2",
  "left-center": "right-full top-1/2 -translate-y-1/2 mr-2",
  "left-end": "right-full bottom-0 mr-2",
  "right-start": "left-full top-0 ml-2",
  "right-center": "left-full top-1/2 -translate-y-1/2 ml-2",
  "right-end": "left-full bottom-0 ml-2",
};

export function Popover({
  trigger,
  content,
  side = "bottom",
  align = "center",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, close]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  const positionKey = `${side}-${align}`;
  const positionClass = sidePositionClasses[positionKey] ?? sidePositionClasses["bottom-center"];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className ?? ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-md"
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={contentId}
          role="dialog"
          aria-modal="false"
          className={`absolute z-50 min-w-[12rem] rounded-xl border border-slate-200 bg-white p-4 shadow-lg ${positionClass}`}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
