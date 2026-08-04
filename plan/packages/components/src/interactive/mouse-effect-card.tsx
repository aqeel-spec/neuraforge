'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MouseEffectCardProps {
  title?: string;
  subtitle?: string;
  topText?: string;
  topSubtext?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  footerText?: string;
  dotSize?: number;
  dotSpacing?: number;
  repulsionRadius?: number;
  repulsionStrength?: number;
  className?: string;
  children?: React.ReactNode;
}

interface Dot {
  id: string;
  baseX: number;
  baseY: number;
  opacity: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.5 };

// ─── Dot Generation ─────────────────────────────────────────────────────────

function generateDots(width: number, height: number, spacing: number): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const x = col * spacing;
      const y = row * spacing;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const edgeFactor = Math.min(dist / (maxDist * 0.7), 1);

      if (Math.random() > edgeFactor) continue;

      const pattern = (row + col) % 3;
      const baseOpacities = [0.3, 0.5, 0.7];
      dots.push({
        id: `${row}-${col}`,
        baseX: x,
        baseY: y,
        opacity: (baseOpacities[pattern] ?? 0.4) * edgeFactor,
      });
    }
  }
  return dots;
}

// ─── Single Dot ─────────────────────────────────────────────────────────────

interface DotProps {
  dot: Dot;
  dotSize: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  repulsionRadius: number;
  repulsionStrength: number;
}

const DotEl = memo(function DotEl({ dot, dotSize, mouseX, mouseY, repulsionRadius, repulsionStrength }: DotProps) {
  const shouldReduceMotion = useReducedMotion();
  const posX = useTransform([mouseX, mouseY], () => {
    const mx = mouseX.get();
    const my = mouseY.get();
    if (!Number.isFinite(mx) || !Number.isFinite(my)) return 0;
    const dx = dot.baseX - mx;
    const dy = dot.baseY - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < repulsionRadius) {
      const force = (1 - dist / repulsionRadius) * repulsionStrength;
      return Math.cos(Math.atan2(dy, dx)) * force;
    }
    return 0;
  });

  const posY = useTransform([mouseX, mouseY], () => {
    const mx = mouseX.get();
    const my = mouseY.get();
    if (!Number.isFinite(mx) || !Number.isFinite(my)) return 0;
    const dx = dot.baseX - mx;
    const dy = dot.baseY - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < repulsionRadius) {
      const force = (1 - dist / repulsionRadius) * repulsionStrength;
      return Math.sin(Math.atan2(dy, dx)) * force;
    }
    return 0;
  });

  const opacityBoost = useTransform([mouseX, mouseY], () => {
    const mx = mouseX.get();
    const my = mouseY.get();
    if (!Number.isFinite(mx) || !Number.isFinite(my)) return 0;
    const dx = dot.baseX - mx;
    const dy = dot.baseY - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = repulsionRadius * 1.2;
    return dist < maxDist ? (1 - dist / maxDist) * 0.8 : 0;
  });

  const x = useSpring(posX, SPRING_CONFIG);
  const y = useSpring(posY, SPRING_CONFIG);
  const opaSpring = useSpring(opacityBoost, { stiffness: 150, damping: 25 });

  return (
    <motion.div
      className="absolute rounded-full bg-violet-400/60 dark:bg-violet-300/50 will-change-transform"
      style={{
        width: dotSize,
        height: dotSize,
        left: dot.baseX,
        top: dot.baseY,
        x,
        y,
        opacity: opaSpring,
      }}
      animate={{ opacity: [dot.opacity * 0.5, dot.opacity * 1.5, dot.opacity * 0.5] }}
      transition={{ duration: 0.8 + Math.random() * 0.3, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
    />
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────

export function MouseEffectCard({
  title = 'NeuraForge',
  subtitle = 'Build interfaces with interactive patterns',
  topText = 'AI-Native Components',
  topSubtext = '200+ production-ready',
  primaryCtaText = 'Get Started',
  secondaryCtaText = 'View Docs',
  onPrimaryClick,
  onSecondaryClick,
  footerText = 'MCP-Ready • Accessible • MIT Licensed',
  dotSize = 2,
  dotSpacing = 16,
  repulsionRadius = 80,
  repulsionStrength = 20,
  className = '',
  children,
}: MouseEffectCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setDots(generateDots(rect.width, rect.height, dotSpacing));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [dotSpacing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
    mouseY.set(Infinity);
  }, [mouseX, mouseY]);

  return (
    <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-950 shadow-xl ${className}`}>
      <div
        ref={containerRef}
        className="relative h-[420px] w-full overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="presentation"
      >
        {/* Dots */}
        {dots.map((dot) => (
          <DotEl
            key={dot.id}
            dot={dot}
            dotSize={dotSize}
            mouseX={mouseX}
            mouseY={mouseY}
            repulsionRadius={repulsionRadius}
            repulsionStrength={repulsionStrength}
          />
        ))}

        {/* Top label */}
        {topText && (
          <div className="absolute top-6 left-6 z-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-white/60 blur-lg dark:bg-zinc-950/60" />
              <div className="relative flex flex-col gap-0.5">
                <p className="font-bold text-sm text-zinc-900 dark:text-white">{topText}</p>
                {topSubtext && <p className="text-xs text-zinc-500 dark:text-zinc-400">{topSubtext}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Center content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/80 blur-2xl dark:bg-zinc-950/80" />
              <h2 className="relative text-center font-bold text-4xl text-zinc-900 tracking-tight dark:text-white">{title}</h2>
            </div>
            {(subtitle || children) && (
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-white/60 blur-xl dark:bg-zinc-950/60" />
                <p className="relative max-w-sm text-center text-base text-zinc-600 leading-relaxed dark:text-zinc-300">
                  {children || subtitle}
                </p>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={onPrimaryClick}
                className="rounded-full bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                {primaryCtaText}
              </button>
              {secondaryCtaText && (
                <button
                  onClick={onSecondaryClick}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all"
                >
                  {secondaryCtaText}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {footerText && (
          <div className="absolute bottom-6 inset-x-0 z-10 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/60 blur-lg dark:bg-zinc-950/60" />
              <p className="relative px-4 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{footerText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MouseEffectCard;
