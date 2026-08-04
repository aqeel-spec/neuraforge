'use client';

import { useCallback, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { classes, focusRing } from "./shared.js";

export interface NavigationMenuChild {
  label: string;
  href: string;
  description?: string;
}

export interface NavigationMenuItem {
  label: string;
  href?: string;
  children?: NavigationMenuChild[];
}

export interface NavigationMenuProps {
  items: NavigationMenuItem[];
  className?: string;
}

export function NavigationMenu({ items, className }: NavigationMenuProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = useCallback((index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenIndex(index);
  }, []);

  const closeDropdown = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenIndex(null), 150);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, index: number) => {
      if (e.key === "Escape") {
        setOpenIndex(null);
      } else if (e.key === "Enter" || e.key === " ") {
        const item = items[index];
        if (item && item.children) {
          e.preventDefault();
          setOpenIndex((prev) => (prev === index ? null : index));
        }
      }
    },
    [items],
  );

  return (
    <nav aria-label="Main navigation" className={classes("relative", className)}>
      <ul role="list" className="flex items-center gap-1">
        {items.map((item, index) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openIndex === index;

          return (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => hasChildren && openDropdown(index)}
              onMouseLeave={closeDropdown}
            >
              {hasChildren ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={classes(
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900",
                    focusRing,
                  )}
                >
                  {item.label}
                  <svg
                    aria-hidden="true"
                    className={classes("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <a
                  href={item.href}
                  className={classes(
                    "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900",
                    focusRing,
                  )}
                >
                  {item.label}
                </a>
              )}

              {hasChildren && isOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  onMouseEnter={() => openDropdown(index)}
                  onMouseLeave={closeDropdown}
                >
                  {item.children!.map((child) => (
                    <a
                      key={child.href}
                      href={child.href}
                      role="menuitem"
                      className={classes(
                        "block rounded-md px-3 py-2 transition-colors hover:bg-slate-50",
                        focusRing,
                      )}
                    >
                      <span className="block text-sm font-medium text-slate-900">
                        {child.label}
                      </span>
                      {child.description ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {child.description}
                        </span>
                      ) : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
