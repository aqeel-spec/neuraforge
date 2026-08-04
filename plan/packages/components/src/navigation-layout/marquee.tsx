import type { ReactNode } from "react";
import { classes } from "./shared.js";

export interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const animationDirection = direction === "left" ? "normal" : "reverse";

  return (
    <div
      role="marquee"
      aria-live="off"
      className={classes(
        "group overflow-hidden",
        className,
      )}
    >
      <div
        className={classes(
          "flex w-max motion-safe:animate-[marquee-scroll_var(--marquee-duration)_linear_infinite]",
          "motion-reduce:animate-none",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={
          {
            "--marquee-duration": `${speed > 0 ? 100 / speed * 20 : 50}s`,
            animationDirection,
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center" aria-hidden="false">
          {children}
        </div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>

      {/* Inline keyframes for SSR safety — no external CSS required */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`,
        }}
      />
    </div>
  );
}
