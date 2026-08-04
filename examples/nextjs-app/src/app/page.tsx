"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Package, Zap, Shield, Accessibility, Terminal, Globe,
  ArrowRight, CheckCircle2, Sparkles, Bot, Code2, Layers,
  Lock, Gauge
} from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number | string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  const numTarget = typeof target === "string" ? parseInt(target.replace(/,/g, "")) : target;

  useEffect(() => {
    if (!isInView || isNaN(numTarget)) return;
    const duration = 1500;
    const steps = 40;
    const increment = numTarget / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numTarget) {
        setCount(numTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, numTarget]);

  const display = isNaN(numTarget) ? target : count.toLocaleString() + suffix;
  return <span ref={ref}>{display}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

const features = [
  {
    icon: Bot,
    title: "Agent-First Architecture",
    description: "AI agents query components over MCP. No docs browsing, no copy-paste needed.",
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "group-hover:border-violet-200",
    iconColor: "text-violet-600",
  },
  {
    icon: Shield,
    title: "Integrity Verified",
    description: "SHA-256 checksums on every artifact. Tampered code never reaches your project.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "group-hover:border-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    icon: Accessibility,
    title: "WCAG 2.2 AA",
    description: "Keyboard navigable, screen-reader tested, reduced-motion safe. Every component.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "group-hover:border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    icon: Terminal,
    title: "Transactional CLI",
    description: "Preview → Confirm → Apply → Rollback. Never writes without your approval.",
    gradient: "from-orange-500/10 to-amber-500/10",
    border: "group-hover:border-orange-200",
    iconColor: "text-orange-600",
  },
  {
    icon: Globe,
    title: "Self-Hostable",
    description: "Run everything offline with docker compose. No account, license, or internet.",
    gradient: "from-rose-500/10 to-pink-500/10",
    border: "group-hover:border-rose-200",
    iconColor: "text-rose-600",
  },
  {
    icon: Sparkles,
    title: "Motion System",
    description: "Framer Motion presets with reduced-motion fallbacks. Animations that respect users.",
    gradient: "from-indigo-500/10 to-violet-500/10",
    border: "group-hover:border-indigo-200",
    iconColor: "text-indigo-600",
  },
];

const stats = [
  { label: "Components", value: 41, suffix: "" },
  { label: "Packages", value: 14, suffix: "" },
  { label: "Tests", value: 892, suffix: "+" },
  { label: "License", value: "MIT", suffix: "" },
];

const packages = [
  { name: "@neuraforge-ui/components", desc: "41 React + Tailwind components", size: "48.2 kB" },
  { name: "@neuraforge-ui/tokens", desc: "Design tokens & Tailwind theme", size: "7.3 kB" },
  { name: "@neuraforge-ui/motion", desc: "Framer Motion animation presets", size: "26.4 kB" },
  { name: "@neuraforge-ui/mcp-core", desc: "MCP server & operation registry", size: "26.4 kB" },
  { name: "@neuraforge-ui/cli", desc: "Transactional install CLI", size: "33.9 kB" },
  { name: "@neuraforge-ui/compositions", desc: "Curated page section layouts", size: "19.9 kB" },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* ─── HERO ─── */}
      <section className="relative gradient-mesh rounded-2xl -mx-2 px-2 py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-6"
        >
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200/80 shadow-sm">
              <Sparkles className="h-3 w-3" />
              v0.1.0 — Just shipped
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/80">
              <CheckCircle2 className="h-2.5 w-2.5" />
              41 components
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-[2.75rem] leading-[1.08] font-bold tracking-tight lg:text-5xl"
          >
            Components that
            <br />
            <span className="gradient-text">AI agents trust.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-[17px] text-[hsl(var(--muted-foreground))] max-w-xl leading-relaxed"
          >
            A React + Tailwind library designed for how code is increasingly written —
            agents discover, verify, and install real components over MCP. Checksum verified. MIT licensed.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/components/navigation"
              className="group inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--background))] hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-lg"
            >
              Explore Components
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/aqeel-spec/neuraforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all duration-200"
            >
              <Code2 className="h-4 w-4" />
              View Source
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-center card-hover"
            >
              <div className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] tabular-nums">
                {typeof stat.value === "number" ? (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-[12px] font-medium text-[hsl(var(--muted-foreground))] mt-1.5 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── TERMINAL ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-2xl bg-[#09090b] p-6 shadow-2xl border border-zinc-800/80 overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="ml-3 text-[11px] text-zinc-500 font-mono">~ / my-project</span>
          </div>
          <div className="font-mono text-[13px] leading-[2] space-y-1">
            <div>
              <span className="text-zinc-500">❯ </span>
              <span className="text-emerald-400">npm</span>
              <span className="text-zinc-300"> install </span>
              <span className="text-amber-300">@neuraforge-ui/components</span>
              <span className="text-zinc-300"> </span>
              <span className="text-amber-300">@neuraforge-ui/tokens</span>
            </div>
            <div className="text-zinc-600">
              added 2 packages in 1.2s
            </div>
            <div className="mt-2">
              <span className="text-zinc-500">❯ </span>
              <span className="text-emerald-400">npx</span>
              <span className="text-zinc-300"> @neuraforge-ui/cli </span>
              <span className="text-cyan-400">search</span>
              <span className="text-zinc-300"> </span>
              <span className="text-amber-200">&quot;pricing tiers&quot;</span>
            </div>
            <div className="text-zinc-400">
              <span className="text-zinc-500">  ├─ </span>
              <span className="text-violet-400">Pricing</span>
              <span className="text-zinc-500"> · </span>
              <span className="text-zinc-400">Responsive pricing tiers with feature comparison</span>
            </div>
            <div className="text-zinc-400">
              <span className="text-zinc-500">  └─ </span>
              <span className="text-violet-400">Stat</span>
              <span className="text-zinc-500"> · </span>
              <span className="text-zinc-400">Key metric display with trend indicator</span>
            </div>
            <div className="mt-2">
              <span className="text-zinc-500">❯ </span>
              <span className="text-emerald-400">npx</span>
              <span className="text-zinc-300"> @neuraforge-ui/cli </span>
              <span className="text-cyan-400">install</span>
              <span className="text-zinc-300"> pricing@1.0.0</span>
            </div>
            <div className="text-emerald-400">
              ✓ Checksum verified · Component installed
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── FEATURES BENTO ─── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Why NeuraForge UI?</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px]">Built different from the ground up.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-hover cursor-default ${feature.border}`}
              >
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5 mb-3 ring-1 ring-inset ring-black/[0.03]`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))] tracking-tight">{feature.title}</h3>
                <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── PACKAGES ─── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Packages</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">14 packages, all MIT licensed and open source.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden divide-y divide-[hsl(var(--border))]"
        >
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-5 py-4 hover:bg-[hsl(var(--muted))]/40 transition-colors duration-200 group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                  <code className="text-[13px] font-mono font-semibold text-[hsl(var(--foreground))]">{pkg.name}</code>
                </div>
                <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5 ml-[22px]">{pkg.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">{pkg.size}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/80">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  0.1.0
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── MCP SETUP ─── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">MCP Setup</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px]">
            One config block. Your AI agent discovers all 41 components instantly.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <pre className="code-block">{`{
  "mcpServers": {
    "neuraforge": {
      "command": "node",
      "args": ["node_modules/@neuraforge-ui/mcp-core/dist/server.js"]
    }
  }
}`}</pre>
        </motion.div>
      </section>
    </div>
  );
}
