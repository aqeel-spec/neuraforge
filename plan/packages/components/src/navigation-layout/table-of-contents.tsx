import { classes, focusRing } from "./shared.js";

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

export interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  className?: string;
}

export function TableOfContents({ items, activeId, className }: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents" className={classes("text-sm", className)}>
      <ul role="list" className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const indent = (item.level - 1) * 12;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                style={{ paddingLeft: `${indent + 8}px` }}
                className={classes(
                  "block rounded-md py-1.5 pr-3 transition-colors",
                  focusRing,
                  isActive
                    ? "border-l-2 border-indigo-600 font-medium text-indigo-600"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
