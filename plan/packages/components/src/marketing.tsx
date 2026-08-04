import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface MarketingAction {
  label: string;
  href: string;
  accessibleLabel?: string;
}

type ActionLinkProps = MarketingAction & {
  emphasis: "primary" | "secondary";
};

function ActionLink({ label, href, accessibleLabel, emphasis }: ActionLinkProps) {
  return (
    <a
      aria-label={accessibleLabel}
      className={joinClasses(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        emphasis === "primary"
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
      )}
      href={href}
    >
      {label}
    </a>
  );
}

export interface CallToActionProps {
  title: string;
  description: ReactNode;
  primaryAction: MarketingAction;
  secondaryAction?: MarketingAction;
  eyebrow?: string;
  className?: string;
}

export function CallToAction({
  title,
  description,
  primaryAction,
  secondaryAction,
  eyebrow,
  className,
}: CallToActionProps) {
  return (
    <section
      aria-labelledby="neuraforge-cta-title"
      className={joinClasses(
        "rounded-2xl bg-slate-950 px-6 py-10 text-white supports-[backdrop-filter:blur(0)]:bg-slate-950/95 supports-[backdrop-filter:blur(0)]:backdrop-blur",
        className,
      )}
      data-capability-fallback="solid-surface"
    >
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow !== undefined && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-300">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold tracking-tight" id="neuraforge-cta-title">
          {title}
        </h2>
        <div className="mx-auto mt-3 max-w-2xl text-base text-slate-300">{description}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ActionLink {...primaryAction} emphasis="primary" />
          {secondaryAction !== undefined && (
            <ActionLink {...secondaryAction} emphasis="secondary" />
          )}
        </div>
      </div>
    </section>
  );
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  cadence?: string;
  features: readonly string[];
  action: MarketingAction;
  featured?: boolean;
}

export interface PricingProps {
  title: string;
  description?: string;
  plans: readonly PricingPlan[];
  className?: string;
}

export function Pricing({ title, description, plans, className }: PricingProps) {
  const headingId = "neuraforge-pricing-title";
  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950" id={headingId}>
          {title}
        </h2>
        {description !== undefined && <p className="mt-3 text-slate-600">{description}</p>}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            aria-labelledby={`pricing-plan-${plan.id}`}
            className={joinClasses(
              "flex flex-col rounded-2xl border bg-white p-6",
              plan.featured === true
                ? "border-indigo-600 ring-1 ring-indigo-600"
                : "border-slate-200",
            )}
            key={plan.id}
          >
            <h3 className="text-lg font-semibold text-slate-950" id={`pricing-plan-${plan.id}`}>
              {plan.name}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
            <p className="mt-5 text-slate-950">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              {plan.cadence !== undefined && (
                <span className="ml-1 text-sm text-slate-500">{plan.cadence}</span>
              )}
            </p>
            <ul className="my-6 flex-1 space-y-3 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <span aria-hidden="true" className="text-emerald-600">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <ActionLink
              {...plan.action}
              emphasis={plan.featured === true ? "primary" : "secondary"}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: ReactNode;
  className?: string;
}

export function Testimonial({ quote, author, role, avatar, className }: TestimonialProps) {
  return (
    <figure
      className={joinClasses(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <blockquote className="text-lg leading-8 text-slate-800">
        <span aria-hidden="true">“</span>
        {quote}
        <span aria-hidden="true">”</span>
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {avatar}
        <span>
          <span className="block font-semibold text-slate-950">{author}</span>
          {role !== undefined && <span className="block text-sm text-slate-500">{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface FaqProps {
  title: string;
  items: readonly FaqItem[];
  className?: string;
}

export function Faq({ title, items, className }: FaqProps) {
  return (
    <section aria-labelledby="neuraforge-faq-title" className={className}>
      <h2
        className="text-3xl font-semibold tracking-tight text-slate-950"
        id="neuraforge-faq-title"
      >
        {title}
      </h2>
      <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((item) => (
          <details className="group py-4" key={item.id}>
            <summary className="cursor-pointer list-none pr-8 font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
              {item.question}
            </summary>
            <div className="mt-3 max-w-3xl text-slate-600">{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export interface FeatureItem {
  id: string;
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  action?: MarketingAction;
}

export interface FeatureGridProps {
  title: string;
  description?: string;
  features: readonly FeatureItem[];
  className?: string;
}

export function FeatureGrid({ title, description, features, className }: FeatureGridProps) {
  return (
    <section aria-labelledby="neuraforge-features-title" className={className}>
      <div className="max-w-2xl">
        <h2
          className="text-3xl font-semibold tracking-tight text-slate-950"
          id="neuraforge-features-title"
        >
          {title}
        </h2>
        {description !== undefined && <p className="mt-3 text-slate-600">{description}</p>}
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li className="rounded-xl border border-slate-200 bg-white p-5" key={feature.id}>
            {feature.icon !== undefined && (
              <span aria-hidden="true" className="mb-4 inline-flex text-indigo-600">
                {feature.icon}
              </span>
            )}
            <h3 className="font-semibold text-slate-950">{feature.title}</h3>
            <div className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</div>
            {feature.action !== undefined && (
              <a
                aria-label={feature.action.accessibleLabel}
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                href={feature.action.href}
              >
                {feature.action.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const marketingComponentIds = [
  "call-to-action",
  "pricing",
  "testimonial",
  "faq",
  "feature-grid",
] as const;
