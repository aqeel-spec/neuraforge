'use client';

import { useEffect, useRef, useState } from "react";

export interface HeroAction {
  /** Button/link label */
  label: string;
  /** Link destination */
  href: string;
  /** Visual variant */
  variant: "primary" | "secondary";
}

export interface HeroWithVideoProps {
  /** Main heading text */
  title: string;
  /** Optional subtitle below the heading */
  subtitle?: string;
  /** Video source URL */
  videoSrc: string;
  /** Poster image shown before video loads or when paused */
  videoPoster?: string;
  /** CTA action buttons */
  actions?: HeroAction[];
  /** Whether to show a dark overlay for text readability */
  overlay?: boolean;
  /** Overlay opacity from 0 to 1 */
  overlayOpacity?: number;
  /** Additional CSS classes */
  className?: string;
}

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * HeroWithVideo — Full-width hero section with background video.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe.
 * Respects prefers-reduced-motion by pausing video and showing poster.
 */
export function HeroWithVideo({
  title,
  subtitle,
  videoSrc,
  videoPoster,
  actions,
  overlay = true,
  overlayOpacity = 0.5,
  className,
}: HeroWithVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section
      className={joinClasses(
        "relative flex items-center justify-center min-h-[60vh] w-full overflow-hidden",
        className,
      )}
      aria-labelledby="hero-video-title"
    >
      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        poster={videoPoster}
        autoPlay={!prefersReducedMotion}
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/* Dark overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-16">
        <h1
          id="hero-video-title"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {actions && actions.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={joinClasses(
                  "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
                  action.variant === "primary" &&
                    "bg-blue-600 text-white hover:bg-blue-700",
                  action.variant === "secondary" &&
                    "bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur-sm",
                )}
              >
                {action.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
