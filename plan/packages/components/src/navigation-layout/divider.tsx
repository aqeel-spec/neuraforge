import type { ReactNode } from "react";
import { classes } from "./shared.js";

export interface DividerProps {
  /** Direction of the divider line. */
  orientation?: "horizontal" | "vertical";
  /** Optional label displayed in the center of the divider. */
  label?: ReactNode;
  className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={classes(
          "inline-flex h-full min-h-[1em] w-px self-stretch bg-slate-200",
          className,
        )}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={classes("flex items-center gap-3", className)}
      >
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    );
  }

  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={classes("h-px border-0 bg-slate-200", className)}
    />
  );
}
