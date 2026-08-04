'use client';

import type { HTMLAttributes, ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  children?: ReactNode;
  variant?: AlertVariant;
  dismissLabel?: string;
  onDismiss?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
  info: "border-sky-300 bg-sky-50 text-sky-950",
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  error: "border-red-300 bg-red-50 text-red-950",
};

export function Alert({
  title,
  children,
  variant = "info",
  dismissLabel = "Dismiss alert",
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const urgent = variant === "error" || variant === "warning";
  return (
    <div
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      className={`flex items-start gap-3 rounded-md border p-4 ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <strong className="font-semibold">{title}</strong>
        {children ? <div className="mt-1 text-sm">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-2 py-1 text-sm font-medium outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          aria-label={dismissLabel}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
