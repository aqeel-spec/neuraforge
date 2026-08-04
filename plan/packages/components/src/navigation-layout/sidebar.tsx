import type { HTMLAttributes, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";
import type { NavigationItem } from "./shared.js";

export interface SidebarSection {
  title?: string;
  items: readonly NavigationItem[];
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  sections: readonly SidebarSection[];
  header?: ReactNode;
  footer?: ReactNode;
  label?: string;
}

/**
 * A vertical sidebar navigation component.
 *
 * - Renders a `<nav>` landmark with an accessible label.
 * - Sections are grouped with optional headings using `role="group"` and `aria-labelledby`.
 * - The current link uses `aria-current="page"`.
 * - Disabled items are rendered with `aria-disabled` and not clickable.
 * - Keyboard: standard link navigation with Tab. Focus ring on all interactive items.
 * - Semantic fallback: renders as a stacked list on narrow viewports.
 */
export function Sidebar({
  sections,
  header,
  footer,
  label = "Sidebar navigation",
  className,
  ...props
}: SidebarProps) {
  return (
    <nav
      aria-label={label}
      className={classes(
        "flex h-full w-64 flex-col border-r border-slate-200 bg-slate-50",
        className,
      )}
      {...props}
    >
      {header ? (
        <div className="shrink-0 border-b border-slate-200 px-4 py-4 font-semibold text-slate-950">
          {header}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, sectionIndex) => {
          const headingId = section.title
            ? `sidebar-section-${section.title.replaceAll(" ", "-").toLowerCase()}`
            : undefined;
          return (
            <div
              key={section.title ?? `section-${String(sectionIndex)}`}
              role={section.title ? "group" : undefined}
              aria-labelledby={headingId}
              className={sectionIndex > 0 ? "mt-6" : undefined}
            >
              {section.title ? (
                <h3
                  id={headingId}
                  className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {section.title}
                </h3>
              ) : null}
              <ul role="list" className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    {item.disabled ? (
                      <span
                        aria-disabled="true"
                        className="block rounded-md px-3 py-2 text-sm text-slate-400"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <a
                        aria-current={item.current ? "page" : undefined}
                        className={classes(
                          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          item.current
                            ? "bg-slate-200 text-slate-950"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                          focusRing,
                        )}
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          {footer}
        </div>
      ) : null}
    </nav>
  );
}
