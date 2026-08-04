import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface StatProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  className?: string;
}

const trendClasses = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-rose-700 dark:text-rose-400",
  neutral: "text-slate-600 dark:text-slate-400",
} as const;

export function Stat({ label, value, description, trend, className }: StatProps) {
  return (
    <article
      className={joinClasses(
        "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
      {(trend !== undefined || description !== undefined) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {trend !== undefined && (
            <span className={joinClasses("font-medium", trendClasses[trend.direction])}>
              <span aria-hidden="true">
                {trend.direction === "up" ? "↑ " : trend.direction === "down" ? "↓ " : "→ "}
              </span>
              {trend.label}
            </span>
          )}
          {description !== undefined && <span className="text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
      )}
    </article>
  );
}
