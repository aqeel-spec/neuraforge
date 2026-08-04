'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface MegaMenuLink {
  label: string;
  href: string;
  description?: string;
}

export interface MegaMenuColumn {
  title: string;
  links: readonly MegaMenuLink[];
}

export interface MegaMenuProps {
  trigger: ReactNode;
  columns: readonly MegaMenuColumn[];
  className?: string;
}

/**
 * A multi-column dropdown navigation menu triggered by hover or click.
 *
 * - The trigger button uses `aria-expanded` and `aria-haspopup="true"`.
 * - The dropdown panel is rendered as a `role="menu"` with columns grouped
 *   by `role="group"` and `aria-labelledby`.
 * - Keyboard: Enter/Space toggles the menu, Escape closes it,
 *   ArrowDown moves focus into the first link. Tab navigates within the menu.
 * - Closes on outside click or when focus leaves the component.
 * - Hover open/close with a short delay to prevent accidental triggers.
 */
export function MegaMenu({ trigger, columns, className }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpen(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(openMenu, 150);
  }, [openMenu]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(closeMenu, 200);
  }, [closeMenu]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, closeMenu]);

  // Close when focus leaves
  useEffect(() => {
    if (!open) return;
    function handleFocusOut(event: FocusEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.relatedTarget as Node | null)
      ) {
        closeMenu();
      }
    }
    const container = containerRef.current;
    container?.addEventListener("focusout", handleFocusOut);
    return () => container?.removeEventListener("focusout", handleFocusOut);
  }, [open, closeMenu]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "Enter":
      case " ": {
        event.preventDefault();
        if (open) {
          closeMenu();
        } else {
          openMenu();
          requestAnimationFrame(() => {
            const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
            firstLink?.focus();
          });
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        if (!open) openMenu();
        requestAnimationFrame(() => {
          const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
          firstLink?.focus();
        });
        break;
      }
      case "Escape": {
        if (open) {
          event.preventDefault();
          closeMenu();
          triggerRef.current?.focus();
        }
        break;
      }
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  }

  return (
    <div
      ref={containerRef}
      className={classes("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={classes(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950",
          focusRing,
        )}
      >
        {trigger}
        <span aria-hidden="true" className="text-xs">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Submenu"
          onKeyDown={handlePanelKeyDown}
          className="absolute left-0 top-full z-40 mt-2 grid auto-cols-fr grid-flow-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
          style={{ minWidth: `${Math.min(columns.length * 220, 720)}px` }}
        >
          {columns.map((column) => {
            const headingId = `megamenu-col-${column.title.replaceAll(" ", "-").toLowerCase()}`;
            return (
              <div key={column.title} role="group" aria-labelledby={headingId}>
                <h3
                  id={headingId}
                  className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {column.title}
                </h3>
                <ul role="list" className="space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        role="menuitem"
                        className={classes(
                          "block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950",
                          focusRing,
                        )}
                      >
                        <div>{link.label}</div>
                        {link.description ? (
                          <div className="mt-0.5 text-xs font-normal text-slate-500">
                            {link.description}
                          </div>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
