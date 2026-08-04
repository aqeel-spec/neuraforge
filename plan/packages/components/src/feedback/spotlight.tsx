import { type ReactNode, type RefObject, useCallback, useEffect, useState } from "react";

export interface SpotlightProps {
  target: RefObject<HTMLElement> | null;
  active: boolean;
  padding?: number;
  borderRadius?: number;
  onClickOutside?: () => void;
  children?: ReactNode;
  className?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Spotlight({
  target,
  active,
  padding = 8,
  borderRadius = 8,
  onClickOutside,
  children,
  className,
}: SpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    if (!target?.current) {
      setRect(null);
      return;
    }
    const el = target.current;
    const box = el.getBoundingClientRect();
    setRect({
      top: box.top - padding,
      left: box.left - padding,
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    });
  }, [target, padding]);

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }
    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  if (!active || !rect) {
    return null;
  }

  const clipPath = `polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
    ${String(rect.left)}px ${String(rect.top)}px,
    ${String(rect.left)}px ${String(rect.top + rect.height)}px,
    ${String(rect.left + rect.width)}px ${String(rect.top + rect.height)}px,
    ${String(rect.left + rect.width)}px ${String(rect.top)}px,
    ${String(rect.left)}px ${String(rect.top)}px
  )`;

  const maskSvg = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><defs><mask id='m'><rect width='100%' height='100%' fill='white'/><rect x='${String(rect.left)}' y='${String(rect.top)}' width='${String(rect.width)}' height='${String(rect.height)}' rx='${String(borderRadius)}' ry='${String(borderRadius)}' fill='black'/></mask></defs><rect width='100%' height='100%' fill='black' mask='url(%23m)'/></svg>`,
  )}")`;

  return (
    <div
      aria-modal="true"
      aria-label="Guided tour step"
      role="dialog"
      className={`fixed inset-0 z-[9999] ${className ?? ""}`}
    >
      {/* Overlay with cutout */}
      <div
        onClick={onClickOutside}
        onKeyDown={(e) => {
          if (e.key === "Escape" && onClickOutside) {
            onClickOutside();
          }
        }}
        className="absolute inset-0 bg-black/60 transition-opacity duration-200 motion-reduce:transition-none dark:bg-black/75"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          maskImage: maskSvg,
          WebkitMaskImage: maskSvg,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Highlight border around target */}
      <div
        className="pointer-events-none absolute ring-2 ring-white/80 dark:ring-white/60"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius,
        }}
        aria-hidden="true"
      />

      {/* Popover content positioned near target */}
      {children ? (
        <div
          className="absolute z-[10000] max-w-sm rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          style={{
            top: rect.top + rect.height + 12,
            left: rect.left,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
