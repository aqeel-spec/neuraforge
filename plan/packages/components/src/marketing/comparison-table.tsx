import type { ReactNode } from "react";

export interface ComparisonPlan {
  /** Plan name (column header) */
  name: string;
  /** Price display string (e.g., "$29/mo") */
  price: string;
  /** Whether this plan is highlighted/recommended */
  highlighted?: boolean;
  /** Feature values keyed by feature name */
  features: Record<string, boolean | string>;
}

export interface FeatureGroup {
  /** Group name (row header) */
  name: string;
  /** Feature names within this group */
  features: string[];
}

export interface ComparisonTableProps {
  /** Array of plan definitions (columns) */
  plans: ComparisonPlan[];
  /** Grouped features (rows) */
  featureGroups: FeatureGroup[];
  /** Additional CSS classes */
  className?: string;
}

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * ComparisonTable — Feature comparison matrix with proper table semantics.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe, responsive.
 */
export function ComparisonTable({
  plans,
  featureGroups,
  className,
}: ComparisonTableProps) {
  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-label="Feature comparison"
    >
      <div className="max-w-6xl mx-auto overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-full sm:min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th
                scope="col"
                className="text-left py-4 px-4 font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="sr-only">Feature</span>
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.name}
                  scope="col"
                  className={joinClasses(
                    "py-4 px-4 text-center font-semibold bg-gray-50 dark:bg-gray-800/50",
                    plan.highlighted
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white",
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    {plan.highlighted && (
                      <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full mb-1">
                        Recommended
                      </span>
                    )}
                    <span>{plan.name}</span>
                    <span className="text-lg font-bold">{plan.price}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureGroups.map((group) => (
              <GroupRows key={group.name} group={group} plans={plans} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupRows({
  group,
  plans,
}: {
  group: FeatureGroup;
  plans: ComparisonPlan[];
}) {
  return (
    <>
      {/* Group header row */}
      <tr className="border-t border-gray-200 dark:border-gray-700">
        <th
          scope="colgroup"
          colSpan={plans.length + 1}
          className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/30"
        >
          {group.name}
        </th>
      </tr>
      {/* Feature rows */}
      {group.features.map((feature) => (
        <tr
          key={feature}
          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
        >
          <th
            scope="row"
            className="text-left py-3 px-4 font-normal text-gray-700 dark:text-gray-300"
          >
            {feature}
          </th>
          {plans.map((plan) => {
            const value = plan.features[feature];
            return (
              <td
                key={`${plan.name}-${feature}`}
                className={joinClasses(
                  "py-3 px-4 text-center",
                  plan.highlighted ? "bg-blue-50/30 dark:bg-blue-900/10" : undefined,
                )}
              >
                {renderFeatureValue(value, feature, plan.name)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function renderFeatureValue(
  value: boolean | string | undefined,
  featureName: string,
  planName: string,
): ReactNode {
  if (value === true) {
    return (
      <span
        aria-label={`${planName} includes ${featureName}`}
        className="inline-flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-green-500 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  if (value === false || value === undefined) {
    return (
      <span
        aria-label={`${planName} does not include ${featureName}`}
        className="inline-flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-gray-300 dark:text-gray-600"
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
      </span>
    );
  }

  // String value
  return (
    <span className="text-gray-700 dark:text-gray-300">{value}</span>
  );
}
