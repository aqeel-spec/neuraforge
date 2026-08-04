export interface TeamMember {
  /** Full name of the team member */
  name: string;
  /** Job title or role */
  role: string;
  /** Photo URL */
  photo: string;
  /** Optional short biography */
  bio?: string;
  /** Optional social media links */
  socials?: { platform: string; url: string }[];
}

export interface TeamGridProps {
  /** Array of team members to display */
  members: TeamMember[];
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

const columnClasses: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * TeamGrid — Responsive grid of team member cards with photos and social links.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe.
 */
export function TeamGrid({
  members,
  columns = 3,
  className,
}: TeamGridProps) {
  const gridCols = columnClasses[columns] ?? columnClasses[3];

  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-label="Team members"
    >
      <div
        className={joinClasses(
          "grid gap-8 max-w-6xl mx-auto",
          gridCols,
        )}
      >
        {members.map((member) => (
          <article
            key={member.name}
            className="flex flex-col items-center text-center rounded-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <img
              src={member.photo}
              alt={`Photo of ${member.name}`}
              loading="lazy"
              decoding="async"
              className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
            />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {member.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {member.role}
            </p>
            {member.bio && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                {member.bio}
              </p>
            )}
            {member.socials && member.socials.length > 0 && (
              <nav
                className="mt-4 flex gap-3"
                aria-label={`${member.name} social links`}
              >
                {member.socials.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on ${social.platform}`}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 rounded-sm"
                  >
                    <span className="text-sm font-medium underline">
                      {social.platform}
                    </span>
                  </a>
                ))}
              </nav>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
