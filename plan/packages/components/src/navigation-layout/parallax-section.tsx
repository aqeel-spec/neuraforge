import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { classes } from "./shared.js";

export interface ParallaxSectionProps {
  children: ReactNode;
  backgroundImage?: string;
  speed?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  height?: string;
  className?: string;
}

export function ParallaxSection({
  children,
  backgroundImage,
  speed = 0.5,
  overlay = false,
  overlayOpacity = 0.5,
  height = "auto",
  className,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mql.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) setOffset(0);
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const handleScroll = useCallback(() => {
    if (prefersReducedMotion.current) return;
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const scrolled = -rect.top * speed;
    setOffset(scrolled);
  }, [speed]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section
      ref={sectionRef}
      className={classes("relative overflow-hidden", className)}
      style={{ height }}
    >
      {/* Background layer */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center motion-reduce:transform-none"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            transform: `translateY(${offset}px)`,
            willChange: "transform",
          }}
          aria-hidden="true"
        />
      ) : null}

      {/* Dark overlay */}
      {overlay ? (
        <div
          className="absolute inset-0 bg-black dark:bg-slate-900"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      ) : null}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
