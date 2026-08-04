'use client';

import { useEffect, useMemo, useRef, useState } from "react";

export interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  spread?: number;
  origin?: { x: number; y: number };
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  dx: number;
  dy: number;
  drift: number;
  shape: "square" | "rect" | "circle";
}

const DEFAULT_COLORS = [
  "#f43f5e",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function Confetti({
  active,
  duration = 3000,
  particleCount = 100,
  colors = DEFAULT_COLORS,
  spread = 60,
  origin = { x: 0.5, y: 0.5 },
  onComplete,
  className,
}: ConfettiProps) {
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const reducedDuration = prefersReducedMotion ? 400 : duration;

    timerRef.current = setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, reducedDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [active, duration, prefersReducedMotion]);

  const particles = useMemo<Particle[]>(() => {
    if (!active) return [];
    const random = seededRandom(Date.now());
    const spreadRad = (spread * Math.PI) / 180;
    const shapes: Array<"square" | "rect" | "circle"> = ["square", "rect", "circle"];

    return Array.from({ length: particleCount }, (_, i) => {
      const angle = -Math.PI / 2 + (random() - 0.5) * spreadRad;
      const velocity = 40 + random() * 60;

      return {
        id: i,
        x: origin.x * 100,
        y: origin.y * 100,
        color: colors[i % colors.length] ?? colors[0] ?? "#f43f5e",
        rotation: random() * 360,
        scale: 0.6 + random() * 0.8,
        dx: Math.cos(angle) * velocity,
        dy: Math.sin(angle) * velocity,
        drift: (random() - 0.5) * 20,
        shape: shapes[Math.floor(random() * shapes.length)] ?? "square",
      };
    });
  }, [active, particleCount, colors, spread, origin]);

  if (!visible) {
    return null;
  }

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[9999] bg-amber-200/20 dark:bg-amber-400/10 ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9999] overflow-hidden ${className ?? ""}`}
    >
      {particles.map((p) => {
        const shapeClasses =
          p.shape === "circle"
            ? "h-2.5 w-2.5 rounded-full"
            : p.shape === "rect"
              ? "h-2 w-4 rounded-sm"
              : "h-3 w-3 rounded-sm";

        return (
          <div
            key={p.id}
            className="absolute animate-[confetti-fall_var(--confetti-duration)_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]"
            style={
              {
                left: `${String(p.x)}%`,
                top: `${String(p.y)}%`,
                "--confetti-duration": `${String(duration)}ms`,
                "--confetti-dx": `${String(p.dx)}px`,
                "--confetti-dy": `${String(p.dy)}px`,
                "--confetti-drift": `${String(p.drift)}px`,
                "--confetti-rotation": `${String(p.rotation)}deg`,
              } as React.CSSProperties
            }
          >
            <div
              className={`${shapeClasses} animate-[confetti-spin_${String(600 + p.id * 7)}ms_linear_infinite]`}
              style={{
                backgroundColor: p.color,
                transform: `scale(${String(p.scale)}) rotate(${String(p.rotation)}deg)`,
                animation: `confetti-spin ${String(600 + (p.id % 5) * 200)}ms linear infinite`,
              }}
            />
          </div>
        );
      })}

      {/* Keyframe injection for CSS animations — SSR safe via inline style element */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes confetti-fall {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(calc(var(--confetti-dx) + var(--confetti-drift)), calc(var(--confetti-dy) + 100vh)) rotate(var(--confetti-rotation)); opacity: 0; }
            }
            @keyframes confetti-spin {
              from { transform: rotateY(0deg) rotateX(0deg); }
              to { transform: rotateY(360deg) rotateX(180deg); }
            }
          `,
        }}
      />
    </div>
  );
}
