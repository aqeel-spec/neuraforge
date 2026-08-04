import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  className?: string;
}

const timelineDotClasses = {
  default: "bg-slate-400 dark:bg-slate-500",
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
} as const;

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol
      className={joinClasses("relative border-l border-slate-200 dark:border-slate-700", className)}
      aria-label="Timeline"
    >
      {items.map((item) => (
        <li key={item.id} className="mb-6 ml-6 last:mb-0">
          <span
            aria-hidden="true"
            className={joinClasses(
              "absolute -left-1.5 mt-1.5 size-3 rounded-full ring-4 ring-white dark:ring-slate-900",
              timelineDotClasses[item.variant ?? "default"],
            )}
          />
          {item.icon !== undefined && (
            <span aria-hidden="true" className="mb-1 inline-flex text-slate-500 dark:text-slate-400">
              {item.icon}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.title}</h3>
          {item.date !== undefined && <time className="text-xs text-slate-500 dark:text-slate-400">{item.date}</time>}
          {item.description !== undefined && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
