export interface StatItem {
  /** The stat value (e.g. "99.9%" or 5000) */
  value: string | number;
  /** Label describing the stat */
  label: string;
  /** Optional prefix (e.g. "$", "#") */
  prefix?: string;
  /** Optional suffix (e.g. "%", "+", "k") */
  suffix?: string;
}

export interface StatsSectionProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Optional section title */
  title?: string;
  /** Optional section description */
  description?: string;
  /** Display variant */
  variant?: "default" | "card" | "minimal";
  /** Additional CSS classes */
  className?: string;
}

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * StatsSection — Row of stat items using semantic dl/dt/dd markup.
 * WCAG 2.2 AA compliant, SSR-safe.
 */
export function StatsSection({
  stats,
  title,
  description,
  variant = "default",
  className,
}: StatsSectionProps) {
  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-labelledby={title ? "stats-section-title" : undefined}
      aria-label={!title ? "Statistics" : undefined}
    >
      <div className="max-w-6xl mx-auto">
        {(title || description) && (
          <div className="text-center mb-10">
            {title && (
              <h2
                id="stats-section-title"
                className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        <dl
          className={joinClasses(
            "grid gap-8 text-center",
            stats.length === 2 && "grid-cols-1 sm:grid-cols-2",
            stats.length === 3 && "grid-cols-1 sm:grid-cols-3",
            stats.length >= 4 && "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {stats.map((stat) => {
            const displayValue = `${stat.prefix ?? ""}${stat.value}${stat.suffix ?? ""}`;

            return (
              <div
                key={stat.label}
                className={joinClasses(
                  "flex flex-col items-center",
                  variant === "card" &&
                    "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6",
                  variant === "default" && "p-4",
                  variant === "minimal" && "p-2",
                )}
                aria-label={`${displayValue} ${stat.label}`}
              >
                <dd className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {stat.prefix && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {stat.prefix}
                    </span>
                  )}
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {stat.suffix}
                    </span>
                  )}
                </dd>
                <dt className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </dt>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
