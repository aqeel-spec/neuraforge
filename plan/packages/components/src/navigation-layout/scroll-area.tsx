import type { ReactNode } from "react";
import { classes } from "./shared.js";

export interface ScrollAreaProps {
  children: ReactNode;
  maxHeight?: string | number;
  className?: string;
}

export function ScrollArea({ children, maxHeight, className }: ScrollAreaProps) {
  const style = maxHeight
    ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
    : undefined;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Scrollable content"
      style={style}
      className={classes(
        "overflow-auto rounded-md scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
