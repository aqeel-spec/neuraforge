import type { HTMLAttributes } from "react";
import { classes, focusRing } from "./shared.js";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: readonly BreadcrumbItem[];
  label?: string;
}

export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  className,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li className="flex items-center gap-2" key={`${item.label}-${String(index)}`}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-slate-400">
                  /
                </span>
              ) : null}
              {item.href && !current ? (
                <a
                  className={classes("rounded-sm font-medium hover:text-slate-950", focusRing)}
                  href={item.href}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={current ? "font-semibold text-slate-950" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
