// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";

// ─── Inline Agent Components (guaranteed to render) ─────────────────────────

function AgentAvatar({ name = "AI", status = "idle", size = "md" }: { name?: string; status?: "idle" | "thinking" | "speaking" | "error"; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-10 h-10 text-xs", md: "w-14 h-14 text-sm", lg: "w-20 h-20 text-base" };
  const rings = {
    idle: "ring-emerald-400 shadow-emerald-400/20",
    thinking: "ring-amber-400 shadow-amber-400/30 animate-pulse",
    speaking: "ring-blue-400 shadow-blue-400/30 animate-[ping_1.5s_ease-in-out_infinite]",
    error: "ring-red-400 shadow-red-400/30",
  };
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white ring-3 shadow-lg ${rings[status]} transition-all`}>
        {initials}
      </div>
      <span className="text-[10px] font-medium text-slate-500 capitalize">{status}</span>
    </div>
  );
}

function SiriOrb({ active = false, size = "md" }: { active?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: 80, md: 120, lg: 160 };
  const s = sizeMap[size];

  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {/* Glow layers */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: s * (0.6 + i * 0.15),
            height: s * (0.6 + i * 0.15),
            background: `radial-gradient(circle, ${
              i === 0 ? "rgba(139,92,246,0.6)" : i === 1 ? "rgba(99,102,241,0.4)" : "rgba(6,182,212,0.2)"
            }, transparent)`,
            filter: `blur(${4 + i * 3}px)`,
          }}
          animate={active ? {
            scale: [1, 1.2 + i * 0.1, 1],
            opacity: [0.8, 1, 0.8],
            rotate: [0, 120 * (i + 1), 360],
          } : { scale: 1, opacity: 0.5 }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* Core */}
      <motion.div
        className="relative rounded-full bg-gradient-to-br from-violet-400 via-indigo-500 to-cyan-400 shadow-2xl shadow-violet-500/40"
        style={{ width: s * 0.35, height: s * 0.35 }}
        animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function MorphBlob({ speed = "medium" }: { speed?: "slow" | "medium" | "fast" }) {
  const dur = speed === "slow" ? 8 : speed === "fast" ? 3 : 5;
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-70"
          style={{
            width: 100 - i * 15,
            height: 100 - i * 15,
            background: i === 0
              ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
              : i === 1
              ? "linear-gradient(135deg, #06b6d4, #8b5cf6)"
              : "linear-gradient(135deg, #f472b6, #6366f1)",
            filter: "blur(2px)",
          }}
          animate={{
            borderRadius: ["40% 60% 60% 40%", "60% 40% 40% 60%", "50% 50% 60% 40%", "40% 60% 60% 40%"],
            rotate: [0, 90, 180, 270, 360],
            x: [0, 10, -10, 5, 0],
            y: [0, -10, 5, 10, 0],
          }}
          transition={{ duration: dur + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function AgentCard({ name, role, capabilities }: { name: string; role: string; capabilities: string[] }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 p-6 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/5 group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{name}</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{role}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <span key={cap} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}

function AgentBootup({ name = "Agent" }: { name?: string }) {
  const [step, setStep] = useState(0);
  const steps = ["Initializing...", "Loading model...", "Connecting...", "Ready ✓"];

  useEffect(() => {
    if (step < 3) {
      const timer = setTimeout(() => setStep(s => s + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-3 h-3 rounded-full"
          animate={{
            backgroundColor: step === steps.length - 1 ? "#10b981" : "#f59e0b",
            scale: step < steps.length - 1 ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 0.6, repeat: step < steps.length - 1 ? Infinity : 0 }}
        />
        <span className="font-semibold text-sm text-slate-900 dark:text-white">{name}</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {/* Status */}
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className={i < step ? "text-emerald-500" : i === step ? "text-amber-500" : "text-slate-300 dark:text-zinc-600"}>
              {i < step ? "✓" : i === step ? "●" : "○"}
            </span>
            <span className={i <= step ? "text-slate-700 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-600"}>{s}</span>
          </motion.div>
        ))}
      </div>
      <button onClick={() => setStep(0)} className="text-[10px] text-violet-500 hover:text-violet-600 font-medium">
        Restart
      </button>
    </div>
  );
}

function MultiAgentFlow() {
  const agents = [
    { id: "planner", name: "Planner", status: "complete" as const },
    { id: "coder", name: "Coder", status: "active" as const },
    { id: "reviewer", name: "Reviewer", status: "idle" as const },
    { id: "deployer", name: "Deployer", status: "idle" as const },
  ];
  const statusColors = { active: "border-violet-500 bg-violet-50 dark:bg-violet-500/10", complete: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", idle: "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900" };
  const dotColors = { active: "bg-violet-500 animate-pulse", complete: "bg-emerald-500", idle: "bg-slate-300 dark:bg-zinc-600" };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between">
        {agents.map((agent, i) => (
          <div key={agent.id} className="flex items-center">
            <div className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 ${statusColors[agent.status]} transition-all`}>
              <div className={`w-2.5 h-2.5 rounded-full ${dotColors[agent.status]}`} />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">{agent.name}</span>
            </div>
            {i < agents.length - 1 && (
              <div className="w-8 h-0.5 bg-slate-200 dark:bg-zinc-700 mx-1">
                {agent.status === "complete" && <div className="h-full bg-emerald-500 rounded-full" />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AgentVisualPage() {
  const [orbActive, setOrbActive] = useState(true);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Agent & AI Visual</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          Visual components for AI agent interfaces — avatars, status orbs, morphing surfaces, agent cards, and multi-agent workflows.
        </p>
      </div>

      {/* Agent Avatar */}
      <ComponentPreview
        id="agent-avatar"
        title="Agent Avatar"
        description="Animated avatar with status ring indicators — idle, thinking, speaking, error"
        code={`import { AgentAvatar } from "@neuraforge-ui/components/src/agent-visual/agent-avatar";

<AgentAvatar name="AI" status="idle" size="lg" />
<AgentAvatar name="AI" status="thinking" size="lg" />
<AgentAvatar name="AI" status="speaking" size="lg" />
<AgentAvatar name="AI" status="error" size="lg" />`}
      >
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <AgentAvatar name="NF" status="idle" size="lg" />
          <AgentAvatar name="NF" status="thinking" size="lg" />
          <AgentAvatar name="NF" status="speaking" size="lg" />
          <AgentAvatar name="NF" status="error" size="lg" />
        </div>
      </ComponentPreview>

      {/* Siri Orb */}
      <ComponentPreview
        id="siri-orb"
        title="Siri Orb"
        description="Pulsating multi-layered gradient orb — Siri/AI assistant style visual"
        code={`import { SiriOrb } from "@neuraforge-ui/components/src/agent-visual/siri-orb";

<SiriOrb active={true} size="lg" />
<SiriOrb active={false} size="md" />`}
      >
        <div className="flex items-center justify-center gap-12 flex-wrap py-4">
          <div className="flex flex-col items-center gap-3">
            <SiriOrb active={orbActive} size="lg" />
            <button
              onClick={() => setOrbActive(!orbActive)}
              className="text-xs font-medium text-violet-500 hover:text-violet-600"
            >
              {orbActive ? "Deactivate" : "Activate"}
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <SiriOrb active={false} size="md" />
            <span className="text-xs text-slate-400">Inactive</span>
          </div>
        </div>
      </ComponentPreview>

      {/* Morph Surface */}
      <ComponentPreview
        id="morph-surface"
        title="Morph Surface"
        description="Continuously morphing gradient blobs — lava lamp / mesh gradient effect"
        code={`import { MorphSurface } from "@neuraforge-ui/components/src/agent-visual/morph-surface";

<MorphSurface colors={["#8b5cf6", "#06b6d4", "#f472b6"]} speed="medium" />`}
      >
        <div className="flex items-center justify-center py-4">
          <MorphBlob speed="medium" />
        </div>
      </ComponentPreview>

      {/* Branding Agent Card */}
      <ComponentPreview
        id="branding-agent"
        title="Branding Agent"
        description="Agent identity card with avatar, role, and capability tags"
        code={`import { BrandingAgent } from "@neuraforge-ui/components/src/agent-visual/branding-agent";

<BrandingAgent
  name="NeuraForge Agent"
  role="UI Component Specialist"
  capabilities={["React", "Tailwind", "Accessibility", "MCP"]}
/>`}
      >
        <div className="flex justify-center">
          <AgentCard
            name="NeuraForge Agent"
            role="UI Component Specialist"
            capabilities={["React", "Tailwind", "Accessibility", "MCP", "TypeScript"]}
          />
        </div>
      </ComponentPreview>

      {/* Sub Agent Starter */}
      <ComponentPreview
        id="sub-agent-starter"
        title="Sub Agent Starter"
        description="Agent boot-up sequence animation with progress and status steps"
        code={`import { SubAgentStarter } from "@neuraforge-ui/components/src/agent-visual/sub-agent-starter";

<SubAgentStarter agentName="CodeReviewer" onReady={() => console.log("ready")} />`}
      >
        <div className="flex justify-center">
          <AgentBootup name="CodeReviewer" />
        </div>
      </ComponentPreview>

      {/* Multi-Agent Flow */}
      <ComponentPreview
        id="ecommerce-multi-agent"
        title="Multi-Agent Workflow"
        description="Connected agent pipeline showing status flow — Planner → Coder → Reviewer → Deployer"
        code={`import { EcommerceMultiAgent } from "@neuraforge-ui/components/src/agent-visual/ecommerce-multi-agent";

<EcommerceMultiAgent agents={[
  { id: "1", name: "Planner", role: "Planning", status: "complete" },
  { id: "2", name: "Coder", role: "Coding", status: "active" },
  { id: "3", name: "Reviewer", role: "Review", status: "idle" },
]} />`}
      >
        <div className="flex justify-center py-4">
          <MultiAgentFlow />
        </div>
      </ComponentPreview>
    </div>
  );
}
