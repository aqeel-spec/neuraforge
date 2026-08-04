'use client';

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { classes, focusRing } from "./shared.js";

export interface DrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Callback to toggle open state. */
  onOpenChange: (open: boolean) => void;
  /** Which side the drawer slides in from. */
  side?: "left" | "right" | "bottom";
  /** Accessible title for the drawer. */
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

const sidePositionClasses = {
  left: "inset-y-0 left-0 w-80 max-w-[85vw]",
  right: "inset-y-0 right-0 w-80 max-w-[85vw]",
  bottom: "inset-x-0 bottom-0 max-h-[85vh]",
} as const;

const slideClasses = {
  left: { open: "translate-x-0", closed: "-translate-x-full" },
  right: { open: "translate-x-0", closed: "translate-x-full" },
  bottom: { open: "translate-y-0", closed: "translate-y-full" },
} as const;

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  title,
  children,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap: move focus into the drawer when it opens
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Delay to allow transition to start
      const timer = setTimeout(() => {
        panelRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Return focus to previously focused element
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus trap: keep Tab within the drawer
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;

    const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={classes(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={classes(
          "fixed z-50 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out",
          sidePositionClasses[side],
          open ? slideClasses[side].open : slideClasses[side].closed,
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close drawer"
            className={classes(
              "rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700",
              focusRing,
            )}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}
