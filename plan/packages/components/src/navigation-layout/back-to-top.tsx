import { useCallback, useEffect, useState } from "react";
import { classes, focusRing } from "./shared.js";

export interface BackToTopProps {
  threshold?: number;
  className?: string;
}

export function BackToTop({ threshold = 300, className }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > threshold);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={classes(
        "fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-opacity hover:bg-indigo-700",
        focusRing,
        className,
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
