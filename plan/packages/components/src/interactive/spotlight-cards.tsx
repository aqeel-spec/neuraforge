'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ─── Constants ──────────────────────────────────────────────────────────────

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SpotlightItem {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

export interface SpotlightCardsProps {
  items?: SpotlightItem[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}

// ─── Default Items ──────────────────────────────────────────────────────────

const DEFAULT_ITEMS: SpotlightItem[] = [
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    title: "Instant",
    description: "Sub-100ms latency on every request, globally distributed across every region.",
    color: "#f59e0b",
  },
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
    title: "Secure",
    description: "Zero-trust by default. SOC 2 certified with end-to-end encryption throughout.",
    color: "#60a5fa",
  },
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    title: "Global",
    description: "Edge-deployed to 300+ locations. Your users always hit a nearby server.",
    color: "#34d399",
  },
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
    title: "Developer First",
    description: "Type-safe SDKs in five languages, a complete REST API, and honest docs.",
    color: "#a78bfa",
  },
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" /></svg>,
    title: "Scalable",
    description: "From side project to Series B without touching your infrastructure config.",
    color: "#38bdf8",
  },
  {
    icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>,
    title: "Serverless",
    description: "No servers to provision, patch, or babysit. Just deploy and move on.",
    color: "#f472b6",
  },
];

// ─── Card Component ─────────────────────────────────────────────────────────

interface CardProps {
  item: SpotlightItem;
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function SpotlightCard({ item, dimmed, onHoverStart, onHoverEnd }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  return (
    <motion.div
      ref={cardRef}
      animate={{ scale: dimmed ? 0.96 : 1, opacity: dimmed ? 0.5 : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-none transition-[border-color] duration-300 hover:border-zinc-300 dark:hover:border-white/[0.14]"
    >
      {/* Static accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${item.color}14, transparent 65%)` }}
      />

      {/* Hover glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ opacity: glowOpacity, background: `radial-gradient(ellipse at 20% 20%, ${item.color}2e, transparent 65%)` }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon badge */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: `${item.color}18`, boxShadow: `inset 0 0 0 1px ${item.color}30`, color: item.color }}
      >
        {item.icon}
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-semibold text-[14px] text-zinc-900 tracking-tight dark:text-white">{item.title}</h3>
        <p className="text-[12.5px] text-zinc-500 leading-relaxed dark:text-white/40">{item.description}</p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{ background: `linear-gradient(to right, ${item.color}80, transparent)` }}
      />
    </motion.div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function SpotlightCards({
  items = DEFAULT_ITEMS,
  eyebrow = 'Features',
  heading = 'Everything you need',
  className = '',
}: SpotlightCardsProps) {
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl px-8 pt-9 pb-10 bg-white dark:bg-[#06060f] ${className}`}>
      {/* Dot grid — light mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      {/* Header */}
      <div className="relative mb-8 flex flex-col gap-1.5">
        <p className="font-semibold text-[10px] text-indigo-600 uppercase tracking-[0.22em] dark:text-indigo-400/80">{eyebrow}</p>
        <h2 className="font-semibold text-[22px] text-zinc-900 tracking-tight dark:text-white">{heading}</h2>
      </div>

      {/* Card grid */}
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <SpotlightCard
            key={item.title}
            item={item}
            dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
            onHoverStart={() => setHoveredTitle(item.title)}
            onHoverEnd={() => setHoveredTitle(null)}
          />
        ))}
      </div>
    </div>
  );
}

export default SpotlightCards;
