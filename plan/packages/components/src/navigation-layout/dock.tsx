'use client';

import { useCallback, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

export interface DockProps {
  items: DockItem[];
  position?: "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
  magnify?: boolean;
  className?: string;
}

const sizeClasses: Record<"sm" | "md" | "lg", { icon: string; container: string }> = {
  sm: { icon: "h-8 w-8", container: "gap-1 p-1.5" },
  md: { icon: "h-10 w-10", container: "gap-2 p-2" },
  lg: { icon: "h-12 w-12", container: "gap-3 p-2.5" },
};

const positionClasses: Record<"bottom" | "left" | "right", string> = {
  bottom: "flex-row",
  left: "flex-col",
  right: "flex-col",
};

/**
 * A macOS-style icon dock with magnification, badges, and keyboard navigation.
 *
 * - `role="toolbar"` with `aria-label` for the dock container.
 * - Each item is a `<button>` (or `<a>` if `href` is provided) with `aria-label`.
 * - Keyboard: ArrowRight/ArrowLeft (horizontal) or ArrowDown/ArrowUp (vertical)
 *   cycles through items with wrapping. Home/End jumps to first/last item.
 * - Hover magnification respects `prefers-reduced-motion` via `motion-safe:` utility.
 * - Tooltip appears on hover/focus via CSS group and peer utilities.
 * - Badges use `aria-label` augmentation for screen readers.
 * - SSR-safe: no `window` or `document` access on initial render.
 */
export function Dock({
  items,
  position = "bottom",
  size = "md",
  magnify = true,
  className,
}: DockProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const isVertical = position === "left" || position === "right";

  const focusItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        setFocusedIndex(index);
        itemRefs.current.get(item.id)?.focus();
      }
    },
    [items],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

    let nextIndex: number | undefined;

    switch (event.key) {
      case nextKey: {
        event.preventDefault();
        nextIndex = (focusedIndex + 1) % items.length;
        break;
      }
      case prevKey: {
        event.preventDefault();
        nextIndex = (focusedIndex - 1 + items.length) % items.length;
        break;
      }
      case "Home": {
        event.preventDefault();
        nextIndex = 0;
        break;
      }
      case "End": {
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      }
      default:
        return;
    }

    if (nextIndex !== undefined) {
      focusItem(nextIndex);
    }
  }

  const sizeConfig = sizeClasses[size];

  return (
    <div
      role="toolbar"
      aria-label="Application dock"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      className={classes(
        "inline-flex items-center rounded-2xl border border-slate-200 bg-white/80 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80",
        positionClasses[position],
        sizeConfig.container,
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const isFocused = index === focusedIndex;
        const badgeLabel =
          item.badge !== undefined ? ` (${item.badge} notification${item.badge === 1 ? "" : "s"})` : "";
        const ariaLabel = `${item.label}${badgeLabel}`;

        const itemClasses = classes(
          "group relative inline-flex items-center justify-center rounded-xl transition-colors",
          focusRing,
          sizeConfig.icon,
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          magnify && "motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-125",
        );

        const tooltip = (
          <span
            role="tooltip"
            className={classes(
              "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-slate-100 dark:text-slate-900",
              isVertical
                ? position === "left"
                  ? "left-full ml-2 top-1/2 -translate-y-1/2"
                  : "right-full mr-2 top-1/2 -translate-y-1/2"
                : "bottom-full mb-2 left-1/2 -translate-x-1/2",
            )}
          >
            {item.label}
          </span>
        );

        const badge = item.badge !== undefined && (
          <span
            aria-hidden="true"
            className={classes(
              "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-red-500 text-white",
              typeof item.badge === "number" || (typeof item.badge === "string" && item.badge.length > 0)
                ? "min-w-[1rem] px-1 text-[10px] font-bold leading-none"
                : "h-2.5 w-2.5",
            )}
          >
            {item.badge}
          </span>
        );

        const content = (
          <>
            <span className="h-5 w-5" aria-hidden="true">
              {item.icon}
            </span>
            {badge}
            {tooltip}
          </>
        );

        if (item.href) {
          return (
            <a
              key={item.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(item.id, el);
                } else {
                  itemRefs.current.delete(item.id);
                }
              }}
              href={item.href}
              aria-label={ariaLabel}
              tabIndex={isFocused ? 0 : -1}
              onClick={item.onClick}
              className={itemClasses}
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(item.id, el);
              } else {
                itemRefs.current.delete(item.id);
              }
            }}
            type="button"
            aria-label={ariaLabel}
            tabIndex={isFocused ? 0 : -1}
            onClick={item.onClick}
            className={itemClasses}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
