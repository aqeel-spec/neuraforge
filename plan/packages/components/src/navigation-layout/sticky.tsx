'use client';

import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { classes } from "./shared.js";

export interface StickyProps {
  /** Content to render inside the sticky container. */
  children: ReactNode;
  /** Top offset in pixels when stuck. @default 0 */
  offset?: number;
  /** Whether sticky positioning is enabled. @default true */
  enabled?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** HTML element type to render. @default 'div' */
  as?: ElementType;
  /** Custom z-index value. */
  zIndex?: number;
}

/**
 * Sticky-positioned container with optional shadow when stuck.
 *
 * Uses IntersectionObserver to detect the stuck state and applies a shadow
 * for visual affordance. SSR-safe — IntersectionObserver is only used
 * when available in the browser.
 *
 * @example
 * ```tsx
 * <Sticky offset={64}>
 *   <nav>Fixed navigation</nav>
 * </Sticky>
 * ```
 */
export function Sticky({
  children,
  offset = 0,
  enabled = true,
  className,
  as: Component = "div",
  zIndex,
}: StickyProps) {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsStuck(false);
      return;
    }

    // SSR-safe: only run IntersectionObserver in the browser
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // When the sentinel scrolls out of view, the sticky element is stuck
          setIsStuck(!entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: `-${offset + 1}px 0px 0px 0px` },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, offset]);

  const style: React.CSSProperties = {
    ...(enabled ? { top: `${offset}px` } : {}),
    ...(zIndex !== undefined ? { zIndex } : {}),
  };

  return (
    <>
      {/* Sentinel element placed before the sticky container to detect stuck state */}
      {enabled && (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="pointer-events-none h-0 w-full"
        />
      )}
      <Component
        style={style}
        className={classes(
          enabled && "sticky",
          isStuck &&
            "shadow-md dark:shadow-lg dark:shadow-black/20 transition-shadow duration-200",
          !isStuck && "transition-shadow duration-200",
          className,
        )}
      >
        {children}
      </Component>
    </>
  );
}
