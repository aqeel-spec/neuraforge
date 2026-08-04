// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import dynamic from "next/dynamic";

const DynamicIsland = dynamic(() => import("@neuraforge-ui/components/src/interactive/dynamic-island").then(m => m.DynamicIsland ? { default: m.DynamicIsland } : m), { ssr: false });
const PowerOffSlide = dynamic(() => import("@neuraforge-ui/components/src/interactive/power-off-slide").then(m => m.PowerOffSlide ? { default: m.PowerOffSlide } : m), { ssr: false });
const Flip = dynamic(() => import("@neuraforge-ui/components/src/interactive/flip").then(m => m.Flip ? { default: m.Flip } : m), { ssr: false });
const MusicPlayer = dynamic(() => import("@neuraforge-ui/components/src/interactive/liquid-glass").then(m => m.MusicPlayer ? { default: m.MusicPlayer } : m), { ssr: false });
const VideoPlayer = dynamic(() => import("@neuraforge-ui/components/src/interactive/liquid-glass").then(m => m.VideoPlayer ? { default: m.VideoPlayer } : m), { ssr: false });
const MouseEffectCard = dynamic(() => import("@neuraforge-ui/components/src/interactive/mouse-effect-card").then(m => m.MouseEffectCard ? { default: m.MouseEffectCard } : m), { ssr: false });
const SpotlightCards = dynamic(() => import("@neuraforge-ui/components/src/interactive/spotlight-cards").then(m => m.SpotlightCards ? { default: m.SpotlightCards } : m), { ssr: false });

// ─── Mouse Effect Demos (inline for reliability) ────────────────────────────

function MagneticButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="px-8 py-4 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
    >
      Magnetic — hover me
    </motion.button>
  );
}

function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: springRX, rotateY: springRY, transformPerspective: 800 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        rotateX.set((ny - 0.5) * -20);
        rotateY.set((nx - 0.5) * 20);
      }}
      onMouseLeave={() => { rotateX.set(0); rotateY.set(0); }}
      className="w-72 h-44 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 flex flex-col justify-between shadow-2xl"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500" />
        <span className="text-white font-semibold">3D Tilt</span>
      </div>
      <p className="text-zinc-400 text-sm">Move cursor to tilt in 3D with perspective</p>
    </motion.div>
  );
}

function GlowCursor() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden cursor-none"
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div
        className="absolute w-40 h-40 rounded-full pointer-events-none transition-all duration-75"
        style={{
          left: pos.x - 80,
          top: pos.y - 80,
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-4 h-4 rounded-full bg-violet-400 pointer-events-none shadow-lg shadow-violet-500/50 transition-all duration-75"
        style={{ left: pos.x - 8, top: pos.y - 8 }}
      />
      <p className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">Glow follows cursor</p>
    </div>
  );
}

function TrailEffect() {
  const [trails, setTrails] = useState<{x: number; y: number; id: number}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden"
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        idRef.current++;
        setTrails(prev => [...prev.slice(-20), { x, y, id: idRef.current }]);
      }}
      onMouseLeave={() => setTrails([])}
    >
      {trails.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500"
          style={{ left: t.x - 6, top: t.y - 6 }}
          onAnimationComplete={() => setTrails(prev => prev.filter(p => p.id !== t.id))}
        />
      ))}
      <p className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">Move to create trail</p>
    </div>
  );
}

function RippleEffect() {
  const [ripples, setRipples] = useState<{x: number; y: number; id: number}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden cursor-pointer"
      onClick={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        idRef.current++;
        setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id: idRef.current }]);
      }}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={() => setRipples(prev => prev.filter(p => p.id !== r.id))}
            className="absolute rounded-full border-2 border-violet-400 pointer-events-none"
            style={{ left: r.x - 100, top: r.y - 100 }}
          />
        ))}
      </AnimatePresence>
      <p className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">Click anywhere for ripple</p>
    </div>
  );
}

function ParticleExplosion() {
  const [particles, setParticles] = useState<{x: number; y: number; angle: number; id: number}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden cursor-pointer"
      onClick={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const newParticles = Array.from({ length: 12 }, (_, i) => {
          idRef.current++;
          return { x: cx, y: cy, angle: (i / 12) * 360, id: idRef.current };
        });
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 800);
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
          animate={{
            x: p.x + Math.cos(p.angle * Math.PI / 180) * 60,
            y: p.y + Math.sin(p.angle * Math.PI / 180) * 60,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-rose-500"
        />
      ))}
      <p className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">Click for particle burst</p>
    </div>
  );
}

function GravityDots() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 200, y: 100 });
  const dots = Array.from({ length: 20 }, (_, i) => ({ id: i, baseX: 30 + (i % 5) * 80, baseY: 30 + Math.floor(i / 5) * 45 }));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden"
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      {dots.map((dot) => {
        const dx = mousePos.x - dot.baseX;
        const dy = mousePos.y - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.min(30, 2000 / (dist + 1));
        const angle = Math.atan2(dy, dx);
        const tx = dot.baseX + Math.cos(angle) * pull;
        const ty = dot.baseY + Math.sin(angle) * pull;

        return (
          <motion.div
            key={dot.id}
            animate={{ x: tx, y: ty }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-sm shadow-emerald-500/30"
            style={{ left: -6, top: -6 }}
          />
        );
      })}
      <p className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm pointer-events-none">Dots attracted to cursor</p>
    </div>
  );
}

// ─── Tab System ─────────────────────────────────────────────────────────────

const EFFECTS = [
  { id: 'magnetic', label: 'Magnetic' },
  { id: 'tilt', label: '3D Tilt' },
  { id: 'glow', label: 'Glow Cursor' },
  { id: 'trail', label: 'Trail' },
  { id: 'ripple', label: 'Ripple' },
  { id: 'particles', label: 'Particles' },
  { id: 'gravity', label: 'Gravity' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'dots', label: 'Dot Repulsion' },
  { id: 'glass', label: 'Liquid Glass' },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function InteractivePage() {
  const [activeTab, setActiveTab] = useState<string>('magnetic');
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Interactive & Mouse Effects</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          10 mouse/cursor effects + gesture interactions. Hover, click, and drag to experience each effect.
        </p>
      </motion.div>

      {/* ─── TABBED MOUSE EFFECTS ─── */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
          {/* Tab Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
            <div>
              <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Mouse Effects</h3>
              <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">10 interactive cursor effects — click each tab to test</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 px-4 py-3 border-b border-[hsl(var(--border))]/50 bg-[hsl(var(--muted))]/30">
            {EFFECTS.map((effect) => (
              <button
                key={effect.id}
                onClick={() => setActiveTab(effect.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  activeTab === effect.id
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                {activeTab === effect.id && (
                  <motion.div
                    layoutId="active-effect-tab"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{effect.label}</span>
              </button>
            ))}
          </div>

          {/* Effect Preview */}
          <div className="p-6 min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center"
              >
                {activeTab === 'magnetic' && <MagneticButton />}
                {activeTab === 'tilt' && <TiltCard />}
                {activeTab === 'glow' && <GlowCursor />}
                {activeTab === 'trail' && <TrailEffect />}
                {activeTab === 'ripple' && <RippleEffect />}
                {activeTab === 'particles' && <ParticleExplosion />}
                {activeTab === 'gravity' && <GravityDots />}
                {activeTab === 'spotlight' && <SpotlightCards eyebrow="Demo" heading="Spotlight Cards" />}
                {activeTab === 'dots' && <MouseEffectCard title="Dot Repulsion" subtitle="Move your cursor over the dots" footerText="Spring physics" />}
                {activeTab === 'glass' && <MusicPlayer title="Liquid Glass" artist="Music Player" />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ─── OTHER INTERACTIVE COMPONENTS ─── */}

      {/* Dynamic Island */}
      <motion.div variants={fadeUp}>
        <ComponentPreview title="Dynamic Island" description="iOS-style morphing pill that expands to show content.">
          <div className="flex flex-col items-center gap-4">
            <DynamicIsland expanded={expanded} expandedContent={
              <div className="p-4 text-white">
                <p className="font-semibold">Now Playing</p>
                <p className="text-sm text-white/70">NeuraForge — Midnight Dreams</p>
              </div>
            }>
              <span className="text-white text-xs px-2">9:41</span>
            </DynamicIsland>
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              {expanded ? "Collapse" : "Expand"} Island
            </button>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Power Off Slide */}
      <motion.div variants={fadeUp}>
        <ComponentPreview title="Power Off Slide" description="Slide-to-confirm gesture control with haptic feedback feel.">
          <div className="flex flex-col items-center gap-3">
            {!confirmed ? (
              <PowerOffSlide onConfirm={() => setConfirmed(true)} label="Slide to confirm" />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 font-semibold">✓ Confirmed!</span>
                <button onClick={() => setConfirmed(false)} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-xs">Reset</button>
              </div>
            )}
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Card Flip */}
      <motion.div variants={fadeUp}>
        <ComponentPreview title="Card Flip" description="Premium 3D card flip on hover with staggered feature reveal and CTA.">
          <div className="flex justify-center gap-6 flex-wrap">
            <Flip title="AI Components" subtitle="Build intelligent interfaces" description="13 purpose-built components for chat and agent workflows." features={["Chat Interface", "Streaming Response", "Tool Call Display", "Context Meter"]} ctaText="Explore AI" accentColor="violet" />
            <Flip title="Premium Blocks" subtitle="Full page sections" description="20 ready-to-use landing page blocks." features={["Hero Sections x5", "Pricing Gradient", "Testimonial Marquee", "FAQ Accordion"]} ctaText="View Blocks" accentColor="cyan" />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Video Player */}
      <motion.div variants={fadeUp}>
        <ComponentPreview title="Video Player" description="Liquid Glass video player with poster preview and frosted glass controls.">
          <div className="flex justify-center py-4">
            <VideoPlayer title="NeuraForge UI Walkthrough" poster="https://placehold.co/640x360/1e1b4b/c4b5fd?text=NeuraForge+Demo" />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
