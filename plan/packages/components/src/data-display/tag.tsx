import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export type TagVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  variant?: TagVariant;
  className?: string;
}

const tagClasses: Record<TagVariant, string> = {
  default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600",
  primary: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-700",
  success: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-700",
  warning: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-700",
  danger: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-700",
};

export function Tag({ children, onRemove, variant = "default", className }: TagProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tagClasses[variant],
        className,
      )}
    >
      {children}
      {onRemove !== undefined && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
          className="ml-0.5 inline-flex size-4 items-center justify-center rounded-sm outline-none hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-current"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}
