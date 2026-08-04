export interface SocialProofStat {
  /** Description of the stat (e.g., "Happy users") */
  label: string;
  /** Numeric or string value */
  value: string | number;
  /** Prefix before the value (e.g., "$") */
  prefix?: string;
  /** Suffix after the value (e.g., "+", "/5") */
  suffix?: string;
}

export interface SocialProofAvatar {
  /** Image source URL */
  src: string;
  /** Person's name, used as alt text */
  name: string;
}

export interface SocialProofProps {
  /** Array of stats to display */
  stats?: SocialProofStat[];
  /** Array of avatar images for the overlapping bubbles */
  avatars?: SocialProofAvatar[];
  /** Optional message below the avatars (e.g., "Join 10,000+ developers") */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * SocialProof — Displays user count/rating with overlapping avatar bubbles.
 * WCAG 2.2 AA compliant, SSR-safe, no client-side-only APIs.
 */
export function SocialProof({
  stats = [],
  avatars = [],
  message,
  className,
}: SocialProofProps) {
  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-label="Social proof"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        {/* Avatar cluster */}
        {avatars.length > 0 && (
          <div className="flex items-center">
            <div
              className="flex -space-x-3"
              role="group"
              aria-label={`${avatars.length} user avatars`}
            >
              {avatars.map((avatar, index) => (
                <img
                  key={`${avatar.name}-${index}`}
                  src={avatar.src}
                  alt={avatar.name}
                  className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-900 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
            {message && (
              <p className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                {message}
              </p>
            )}
          </div>
        )}

        {/* Message without avatars */}
        {avatars.length === 0 && message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <dl className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center"
              >
                <dt className="text-sm text-gray-600 dark:text-gray-400 order-2 mt-1">
                  {stat.label}
                </dt>
                <dd
                  className="text-3xl font-bold text-gray-900 dark:text-white order-1"
                  aria-label={`${stat.prefix ?? ""}${stat.value}${stat.suffix ?? ""} ${stat.label}`}
                >
                  <span aria-hidden="true">
                    {stat.prefix}
                    {stat.value}
                    {stat.suffix}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
