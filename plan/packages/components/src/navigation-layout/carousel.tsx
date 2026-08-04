'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { classes, focusRing } from "./shared.js";

export interface CarouselProps {
  children: ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function Carousel({
  children,
  autoPlay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className,
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = children.length;

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % totalSlides) + totalSlides) % totalSlides;
      setActiveIndex(next);
    },
    [totalSlides],
  );

  const goToPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const goToNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, totalSlides]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "ArrowLeft": {
          event.preventDefault();
          goToPrev();
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          goToNext();
          break;
        }
      }
    },
    [goToPrev, goToNext],
  );

  if (totalSlides === 0) return null;

  return (
    <div
      className={classes("relative overflow-hidden rounded-xl", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Content carousel"
      onKeyDown={handleKeyDown}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${totalSlides}`}
            aria-hidden={index !== activeIndex}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Previous/Next Arrows */}
      {showArrows && totalSlides > 1 ? (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous slide"
            className={classes(
              "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white",
              focusRing,
            )}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className={classes(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white",
              focusRing,
            )}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}

      {/* Dot indicators */}
      {showDots && totalSlides > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2" role="tablist">
          {children.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to slide ${index + 1}`}
              className={classes(
                "h-2.5 w-2.5 rounded-full transition-colors",
                index === activeIndex ? "bg-indigo-600" : "bg-white/60 hover:bg-white/80",
                focusRing,
              )}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
