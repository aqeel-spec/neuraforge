export interface LogoItem {
  /** Company/partner name, used as alt text */
  name: string;
  /** Image source URL */
  src: string;
  /** Optional link URL */
  href?: string;
}

export interface LogoCloudProps {
  /** Array of logo items to display */
  logos: LogoItem[];
  /** Section title */
  title?: string;
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Apply grayscale filter with color on hover */
  grayscale?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const columnClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
};

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * LogoCloud — A grid of partner/client logos with optional grayscale effect.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe.
 */
export function LogoCloud({
  logos,
  title,
  columns = 4,
  grayscale = false,
  className,
}: LogoCloudProps) {
  const gridCols = columnClasses[columns] ?? columnClasses[4];

  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-labelledby={title ? "logo-cloud-title" : undefined}
    >
      {title && (
        <h2
          id="logo-cloud-title"
          className="text-center text-lg font-semibold text-gray-600 dark:text-gray-400 mb-8"
        >
          {title}
        </h2>
      )}
      <div
        className={joinClasses(
          "grid gap-8 items-center justify-items-center max-w-5xl mx-auto",
          gridCols,
        )}
      >
        {logos.map((logo) => {
          const image = (
            <img
              src={logo.src}
              alt={logo.name}
              className={joinClasses(
                "h-12 w-auto max-w-[160px] object-contain",
                grayscale &&
                  "grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300",
              )}
              loading="lazy"
              decoding="async"
            />
          );

          if (logo.href) {
            return (
              <a
                key={logo.name}
                href={logo.href}
                className="flex items-center justify-center rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${logo.name}`}
              >
                {image}
              </a>
            );
          }

          return (
            <div
              key={logo.name}
              className="flex items-center justify-center p-2"
            >
              {image}
            </div>
          );
        })}
      </div>
    </section>
  );
}
