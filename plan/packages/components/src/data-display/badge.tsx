import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  className?: string;
}

const badgeClasses = {
  neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600",
  brand: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-700",
  success: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-700",
  warning: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-700",
  danger: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-700",
} as const;

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        badgeClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
