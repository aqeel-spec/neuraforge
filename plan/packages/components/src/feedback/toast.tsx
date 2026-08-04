import type { HTMLAttributes, ReactNode } from "react";

// `title` is omitted from the inherited DOM attributes because the component's `title` is
// rendered content (any ReactNode), not the string DOM tooltip attribute.
export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  children?: ReactNode;
  tone?: "status" | "error";
  dismissLabel?: string;
  onDismiss?: () => void;
}

export function Toast({
  title,
  children,
  tone = "status",
  dismissLabel = "Dismiss notification",
  onDismiss,
  className,
  ...props
}: ToastProps) {
  const isError = tone === "error";
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end"
    >
      <div
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        aria-atomic="true"
        className={`pointer-events-auto w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 p-4 text-white shadow-xl ${className ?? ""}`}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <strong className="font-semibold">{title}</strong>
            {children ? <div className="mt-1 text-sm text-slate-200">{children}</div> : null}
          </div>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label={dismissLabel}
              className="rounded px-2 py-1 text-sm outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
