"use client";

import Link from "next/link";
import {
  Package, Zap, Shield, Accessibility, Terminal, Globe,
  ArrowRight, CheckCircle2, Sparkles, Bot, Code2, ExternalLink
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Agent-First",
    description: "AI agents query components over MCP. No docs browsing, no copy-paste.",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Shield,
    title: "Integrity Verified",
    description: "SHA-256 checksums on every artifact. Tampered code never reaches your project.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: Accessibility,
    title: "WCAG 2.2 AA",
    description: "Keyboard navigable, screen-reader tested, reduced-motion safe. Always.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: Terminal,
    title: "Transactional CLI",
    description: "Preview → Confirm → Apply → Rollback. Never writes without approval.",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconColor: "text-orange-600",
  },
  {
    icon: Globe,
    title: "Self-Hostable",
    description: "Run offline. No account, no license, no internet required.",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600",
  },
  {
    icon: Sparkles,
    title: "Motion Ready",
    description: "Framer Motion presets with reduced-motion fallbacks built in.",
    gradient: "from-indigo-500/10 to-violet-500/10",
    iconColor: "text-indigo-600",
  },
];

const stats = [
  { label: "Components", value: "20" },
  { label: "Packages", value: "14" },
  { label: "Tests", value: "892" },
  { label: "License", value: "MIT" },
];

const packages = [
  { name: "@neuraforge-ui/components", desc: "20 React + Tailwind components", size: "40.9 kB" },
  { name: "@neuraforge-ui/tokens", desc: "Design tokens & Tailwind theme", size: "7.3 kB" },
  { name: "@neuraforge-ui/motion", desc: "Framer Motion presets", size: "26.4 kB" },
  { name: "@neuraforge-ui/mcp-core", desc: "MCP server & operations", size: "26.4 kB" },
  { name: "@neuraforge-ui/cli", desc: "Transactional install CLI", size: "33.9 kB" },
  { name: "@neuraforge-ui/compositions", desc: "Curated page sections", size: "19.9 kB" },
];

export default function HomePage() {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* ─── HERO ─── */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 dot-pattern opacity-40" />
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[12px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
              <Sparkles className="h-3 w-3" />
              v0.1.0 — Just shipped
            </span>
          </div>

          <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tight">
            Components that<br />
            <span className="gradient-text">AI agents trust.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            A React + Tailwind library designed for how code is increasingly written —
            agents discover, verify, and install real components over MCP.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/components/navigation"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-all shadow-sm hover:shadow-md"
            >
              Explore Components
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/aqeel-spec/neuraforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all"
            >
              <Code2 className="h-4 w-4" />
              View Source
            </a>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 text-center hover-lift">
            <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
            <div className="text-[12px] font-medium text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ─── INSTALL ─── */}
      <section className="rounded-2xl bg-[#0a0a0a] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-[11px] text-zinc-500 font-medium">Terminal</span>
        </div>
        <div className="font-mono text-[13px] leading-relaxed space-y-2">
          <div className="text-zinc-400">
            <span className="text-emerald-400">$</span>{" "}
            <span className="text-zinc-100">npm install @neuraforge-ui/components @neuraforge-ui/tokens</span>
          </div>
          <div className="text-zinc-400">
            <span className="text-emerald-400">$</span>{" "}
            <span className="text-zinc-100">npx @neuraforge-ui/cli search &quot;pricing&quot;</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Why NeuraForge UI?</h2>
          <p className="text-muted-foreground mt-2">Built different from the ground up.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border bg-white p-5 hover-lift cursor-default"
              >
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5 mb-3`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PACKAGES ─── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
          <p className="text-muted-foreground mt-2">14 packages, all MIT licensed and public.</p>
        </div>
        <div className="rounded-xl border bg-white shadow-soft overflow-hidden divide-y">
          {packages.map((pkg) => (
            <div key={pkg.name} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-[13px] font-mono font-semibold text-foreground">{pkg.name}</code>
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">{pkg.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-[11px] font-mono text-muted-foreground">{pkg.size}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  0.1.0
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MCP SETUP ─── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">MCP Setup</h2>
          <p className="text-muted-foreground mt-2">
            One config block. Your AI agent discovers all 20 components instantly.
          </p>
        </div>
        <pre className="code-block">{`{
  "mcpServers": {
    "neuraforge": {
      "command": "node",
      "args": ["node_modules/@neuraforge-ui/mcp-core/dist/server.js"]
    }
  }
}`}</pre>
      </section>
    </div>
  );
}
