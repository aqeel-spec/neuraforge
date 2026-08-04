import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "bottom" | "right" | "left";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const sideClasses: Record<"bottom" | "right" | "left", string> = {
  bottom: "inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl",
  right: "inset-y-0 right-0 w-full max-w-md",
  left: "inset-y-0 left-0 w-full max-w-md",
};

export function Sheet({
  open,
  onOpenChange,
  side = "bottom",
  title,
  children,
  className,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const target =
      panelRef.current?.querySelector<HTMLElement>(focusableSelector) ?? panelRef.current;
    target?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChangeRef.current(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`fixed overflow-y-auto bg-white p-6 shadow-2xl outline-none ${sideClasses[side]} ${className ?? ""}`}
      >
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="rounded p-2 text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
        ) : null}
        {children}
      </div>
    </div>
  );
}
