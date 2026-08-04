'use client';

import { useCallback, useRef, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";
import type { NavigationItem } from "./shared.js";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  items: readonly NavigationItem[];
  actions?: ReactNode;
  label?: string;
}

/**
 * A responsive site-wide navigation bar.
 *
 * - Renders a `<nav>` landmark with an accessible label.
 * - The mobile hamburger menu toggles a disclosure panel. Focus moves into the panel
 *   when opened and returns to the trigger when closed.
 * - Keyboard: Enter/Space on the trigger toggles the panel; Escape closes it.
 * - Disabled items are rendered with `aria-disabled` and not focusable via tab.
 * - The current page link uses `aria-current="page"`.
 * - Visible focus ring on all interactive elements.
 */
export function Navbar({
  brand,
  items,
  actions,
  label = "Main navigation",
  className,
  ...props
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    requestAnimationFrame(() => {
      const firstLink = panelRef.current?.querySelector<HTMLElement>("a:not([aria-disabled])");
      firstLink?.focus();
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [menuOpen, openMenu, closeMenu]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && menuOpen) {
      event.preventDefault();
      closeMenu();
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  }

  return (
    <nav
      aria-label={label}
      className={classes("border-b border-slate-200 bg-white", className)}
      {...props}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0 font-semibold text-slate-950">{brand}</div>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {items.map((item) => (
            <li key={item.href}>
              {item.disabled ? (
                <span
                  aria-disabled="true"
                  className="inline-block rounded-md px-3 py-2 text-sm text-slate-400"
                >
                  {item.label}
                </span>
              ) : (
                <a
                  aria-current={item.current ? "page" : undefined}
                  className={classes(
                    "inline-block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    item.current
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
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

        <div className="flex items-center gap-3">
          {actions ? (
            <div className="hidden md:flex md:items-center md:gap-3">{actions}</div>
          ) : null}

          {/* Mobile menu trigger */}
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="navbar-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={classes("rounded-md p-2 text-slate-700 md:hidden", focusRing)}
            onClick={toggleMenu}
            onKeyDown={handleTriggerKeyDown}
          >
            <span aria-hidden="true" className="block h-5 w-5 text-center leading-5">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <div
          ref={panelRef}
          id="navbar-mobile-menu"
          className="border-t border-slate-200 px-4 pb-4 pt-2 md:hidden"
          onKeyDown={handlePanelKeyDown}
        >
          <ul role="list" className="space-y-1">
            {items.map((item) => (
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
                      "block rounded-md px-3 py-2 text-sm font-medium",
                      item.current
                        ? "bg-slate-100 text-slate-950"
                        : "text-slate-700 hover:bg-slate-50",
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
          {actions ? <div className="mt-3 border-t border-slate-100 pt-3">{actions}</div> : null}
        </div>
      )}
    </nav>
  );
}
