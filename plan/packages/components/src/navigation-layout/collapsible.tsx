import { useId, useState } from "react";
import type { ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface CollapsibleProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  trigger,
  children,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={classes("w-full", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className={classes(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50",
          focusRing,
        )}
      >
        <svg
          aria-hidden="true"
          className={classes(
            "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-90",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>{trigger}</span>
      </button>
      <div
        id={contentId}
        role="region"
        hidden={!open}
        className={classes(
          "overflow-hidden transition-all duration-200",
          open ? "block" : "hidden",
        )}
      >
        <div className="px-3 pb-3 pt-1">{children}</div>
      </div>
    </div>
  );
}
