import type { HTMLAttributes, ReactNode } from "react";

export type BannerVariant = "info" | "warning" | "error" | "success";

export interface BannerAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  message: ReactNode;
  variant?: BannerVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  action?: BannerAction;
  dismissLabel?: string;
}

const variantClasses: Record<BannerVariant, string> = {
  info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  error:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
};

export function Banner({
  message,
  variant = "info",
  dismissible = true,
  onDismiss,
  icon,
  action,
  dismissLabel = "Dismiss banner",
  className,
  ...props
}: BannerProps) {
  const urgent = variant === "error" || variant === "warning";

  return (
    <div
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      aria-atomic="true"
      className={`flex w-full items-center gap-3 border-b px-4 py-3 text-sm ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    >
      {icon ? <span className="flex-shrink-0" aria-hidden="true">{icon}</span> : null}
      <p className="min-w-0 flex-1">{message}</p>
      {action ? (
        action.href ? (
          <a
            href={action.href}
            className="flex-shrink-0 rounded px-2 py-1 text-sm font-semibold underline underline-offset-2 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="flex-shrink-0 rounded px-2 py-1 text-sm font-semibold underline underline-offset-2 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        )
      ) : null}
      {dismissible && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="flex-shrink-0 rounded p-1 outline-none hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
