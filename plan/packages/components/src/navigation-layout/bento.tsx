import type { ReactNode } from "react";
import { classes } from "./shared.js";

export interface BentoItem {
  id: string;
  content: ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2 | 3;
  className?: string;
}

export interface BentoProps {
  items: BentoItem[];
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gapMap: Record<NonNullable<BentoProps["gap"]>, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const colSpanMap: Record<1 | 2 | 3, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

const rowSpanMap: Record<1 | 2 | 3, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

const columnsMap: Record<NonNullable<BentoProps["columns"]>, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

export function Bento({ items, columns = 3, gap = "md", className }: BentoProps) {
  return (
    <div
      className={classes(
        "grid",
        columnsMap[columns],
        gapMap[gap],
        className,
      )}
      role="list"
      aria-label="Bento grid"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="listitem"
          className={classes(
            "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800",
            colSpanMap[item.colSpan ?? 1],
            rowSpanMap[item.rowSpan ?? 1],
            item.className,
          )}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
