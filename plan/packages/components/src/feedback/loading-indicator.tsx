import type { HTMLAttributes } from "react";

export interface LoadingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: number;
}

export function LoadingIndicator({
  label = "Loading…",
  value,
  className,
  ...props
}: LoadingIndicatorProps) {
  const determinate = value !== undefined;
  const normalizedValue = determinate ? Math.min(100, Math.max(0, value)) : undefined;
  return (
    <div
      role={determinate ? "progressbar" : "status"}
      aria-live={determinate ? undefined : "polite"}
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={normalizedValue}
      className={`inline-flex items-center gap-2 text-sm font-medium text-slate-700 ${className ?? ""}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 motion-reduce:animate-none"
      />
      <span>
        {label}
        {determinate ? ` ${String(normalizedValue)}%` : ""}
      </span>
    </div>
  );
}
