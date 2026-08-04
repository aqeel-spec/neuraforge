import type { HTMLAttributes, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface FooterLink {
  label: string;
  href: string;
}
export interface FooterSection {
  title: string;
  links: readonly FooterLink[];
}
export interface FooterProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  description?: ReactNode;
  sections?: readonly FooterSection[];
  legal?: ReactNode;
}

export function Footer({
  brand,
  description,
  sections = [],
  legal,
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      className={classes("border-t border-slate-200 bg-slate-50 text-slate-700", className)}
      {...props}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="font-semibold text-slate-950">{brand}</div>
          {description ? (
            <div className="mt-3 max-w-sm text-sm leading-6">{description}</div>
          ) : null}
        </div>
        {sections.map((section) => (
          <section
            aria-labelledby={`footer-${section.title.replaceAll(" ", "-").toLowerCase()}`}
            key={section.title}
          >
            <h2
              className="text-sm font-semibold text-slate-950"
              id={`footer-${section.title.replaceAll(" ", "-").toLowerCase()}`}
            >
              {section.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a
                    className={classes("rounded-sm text-sm hover:text-slate-950", focusRing)}
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {legal ? (
        <div className="border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-5 text-xs sm:px-6 lg:px-8">{legal}</div>
        </div>
      ) : null}
    </footer>
  );
}
