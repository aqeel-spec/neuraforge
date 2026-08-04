import { useState, type ReactNode } from "react";

export interface AnnouncementBarProps {
  /** Message content to display */
  message: ReactNode;
  /** Optional action link */
  action?: { label: string; href: string };
  /** Whether the bar can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Color variant */
  variant?: "info" | "promo" | "warning";
  /** Additional CSS classes */
  className?: string;
}

const variantClasses: Record<string, string> = {
  promo: "bg-indigo-600 dark:bg-indigo-700 text-white",
  info: "bg-blue-600 dark:bg-blue-700 text-white",
  warning: "bg-amber-500 dark:bg-amber-600 text-gray-900 dark:text-gray-900",
};

const actionVariantClasses: Record<string, string> = {
  promo:
    "text-indigo-100 hover:text-white underline focus-visible:ring-white",
  info: "text-blue-100 hover:text-white underline focus-visible:ring-white",
  warning:
    "text-gray-800 hover:text-gray-900 underline focus-visible:ring-gray-900",
};

const dismissVariantClasses: Record<string, string> = {
  promo:
    "text-indigo-200 hover:text-white focus-visible:ring-white",
  info: "text-blue-200 hover:text-white focus-visible:ring-white",
  warning:
    "text-gray-700 hover:text-gray-900 focus-visible:ring-gray-900",
};

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * AnnouncementBar — Sticky top-of-page promotional bar with dismiss support.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe.
 */
export function AnnouncementBar({
  message,
  action,
  dismissible = true,
  onDismiss,
  variant = "promo",
  className,
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="banner"
      aria-label="Announcement"
      className={joinClasses(
        "sticky top-0 z-50 w-full px-4 py-2.5 text-sm font-medium",
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
        <p className="flex-1 text-center sm:flex-none">
          {message}
        </p>
        {action && (
          <a
            href={action.href}
            className={joinClasses(
              "whitespace-nowrap font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-sm",
              actionVariantClasses[variant],
            )}
          >
            {action.label}
          </a>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className={joinClasses(
              "ml-auto shrink-0 rounded-sm p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              dismissVariantClasses[variant],
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
