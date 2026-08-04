// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";

// ─── Agent Avatar ───────────────────────────────────────────────────────────

function AgentAvatar({ name = "AI", status = "idle", size = "lg" }: { name?: string; status?: string; size?: string }) {
  const sizeClass = size === "sm" ? "w-10 h-10 text-xs" : size === "lg" ? "w-20 h-20 text-lg" : "w-14 h-14 text-sm";
  const ringClass = status === "thinking" ? "ring-amber-400 animate-pulse" : status === "speaking" ? "ring-blue-400" : status === "error" ? "ring-red-400" : "ring-emerald-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ${ringClass}`}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <span className="text-[10px] font-medium text-slate-500 capitalize">{status}</span>
    </div>
  );
}

// ─── Siri Orb (pure CSS animations, no framer-motion) ───────────────────────

function SiriOrb({ active = false }: { active?: boolean }) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div className={`absolute w-32 h-32 rounded-full bg-violet-500/30 blur-xl ${active ? "animate-ping" : ""}`} style={{ animationDuration: "3s" }} />
      <div className={`absolute w-24 h-24 rounded-full bg-indigo-500/40 blur-lg ${active ? "animate-pulse" : ""}`} />
      <div className={`absolute w-16 h-16 rounded-full bg-cyan-400/30 blur-md ${active ? "animate-pulse" : ""}`} style={{ animationDelay: "0.5s" }} />
      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 via-indigo-500 to-cyan-400 shadow-2xl shadow-violet-500/40" />
    </div>
  );
}

// ─── Morph Blob (CSS keyframes only) ────────────────────────────────────────

function MorphBlob() {
  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes morph1 { 0%,100%{border-radius:40% 60% 60% 40%;transform:rotate(0deg)} 50%{border-radius:60% 40% 40% 60%;transform:rotate(180deg)} }
        @keyframes morph2 { 0%,100%{border-radius:50% 50% 40% 60%;transform:rotate(0deg) translate(5px,-5px)} 50%{border-radius:40% 60% 60% 40%;transform:rotate(-180deg) translate(-5px,5px)} }
        @keyframes morph3 { 0%,100%{border-radius:60% 40% 50% 50%;transform:rotate(0deg) translate(-3px,3px)} 50%{border-radius:40% 60% 50% 50%;transform:rotate(180deg) translate(3px,-3px)} }
      `}} />
      <div className="absolute w-28 h-28 bg-gradient-to-br from-violet-500 to-indigo-600 opacity-70 blur-[2px]" style={{ animation: "morph1 6s ease-in-out infinite" }} />
      <div className="absolute w-24 h-24 bg-gradient-to-br from-cyan-400 to-violet-500 opacity-60 blur-[2px]" style={{ animation: "morph2 7s ease-in-out infinite" }} />
      <div className="absolute w-20 h-20 bg-gradient-to-br from-pink-400 to-indigo-500 opacity-50 blur-[1px]" style={{ animation: "morph3 5s ease-in-out infinite" }} />
    </div>
  );
}

// ─── Agent Card ─────────────────────────────────────────────────────────────

function AgentCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 p-6 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">NeuraForge Agent</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">UI Component Specialist</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["React", "Tailwind", "Accessibility", "MCP", "TypeScript"].map((cap) => (
          <span key={cap} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">{cap}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Bootup (no framer-motion, pure CSS transitions) ──────────────────

function AgentBootup() {
  const [step, setStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step < 3) {
      timerRef.current = setTimeout(() => setStep(step + 1), 800);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step]);

  const steps = ["Initializing...", "Loading model...", "Connecting...", "Ready ✓"];
  const pct = ((step + 1) / 4) * 100;

  return (
    <div className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full transition-colors ${step >= 3 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
        <span className="font-semibold text-sm text-slate-900 dark:text-white">CodeReviewer</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i <= step ? "opacity-100" : "opacity-30"}`}>
            <span className={i < step ? "text-emerald-500" : i === step ? "text-amber-500" : "text-slate-300"}>
              {i < step ? "✓" : i === step ? "●" : "○"}
            </span>
            <span className={i <= step ? "text-slate-700 dark:text-zinc-300" : "text-slate-400"}>{s}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setStep(0)} className="text-[10px] text-violet-500 hover:text-violet-600 font-medium">Restart</button>
    </div>
  );
}

// ─── Multi-Agent Flow ───────────────────────────────────────────────────────

function MultiAgentFlow() {
  const agents = [
    { name: "Planner", status: "complete" },
    { name: "Coder", status: "active" },
    { name: "Reviewer", status: "idle" },
    { name: "Deployer", status: "idle" },
  ];

  return (
    <div className="w-full max-w-lg flex items-center justify-between">
      {agents.map((agent, i) => (
        <div key={agent.name} className="flex items-center">
          <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
            agent.status === "complete" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" :
            agent.status === "active" ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" :
            "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              agent.status === "complete" ? "bg-emerald-500" : agent.status === "active" ? "bg-violet-500 animate-pulse" : "bg-slate-300 dark:bg-zinc-600"
            }`} />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">{agent.name}</span>
          </div>
          {i < agents.length - 1 && (
            <div className={`w-6 h-0.5 mx-1 ${agent.status === "complete" ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-700"}`} />
          )}
        </div>
      ))}
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
          Visual components for AI agent interfaces — avatars, orbs, morphing surfaces, agent cards, and multi-agent workflows.
        </p>
      </div>

      <ComponentPreview id="agent-avatar" title="Agent Avatar" description="Animated avatar with status ring indicators" code={`<AgentAvatar name="NF" status="idle" size="lg" />\n<AgentAvatar name="NF" status="thinking" size="lg" />\n<AgentAvatar name="NF" status="speaking" size="lg" />\n<AgentAvatar name="NF" status="error" size="lg" />`}>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <AgentAvatar name="NF" status="idle" size="lg" />
          <AgentAvatar name="NF" status="thinking" size="lg" />
          <AgentAvatar name="NF" status="speaking" size="lg" />
          <AgentAvatar name="NF" status="error" size="lg" />
        </div>
      </ComponentPreview>

      <ComponentPreview id="siri-orb" title="Siri Orb" description="Pulsating multi-layered gradient orb" code={`<SiriOrb active={true} />\n<SiriOrb active={false} />`}>
        <div className="flex items-center justify-center gap-12 flex-wrap py-6">
          <div className="flex flex-col items-center gap-3">
            <SiriOrb active={orbActive} />
            <button onClick={() => setOrbActive(prev => !prev)} className="text-xs font-medium text-violet-500 hover:text-violet-600">
              {orbActive ? "Deactivate" : "Activate"}
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <SiriOrb active={false} />
            <span className="text-xs text-slate-400">Inactive</span>
          </div>
        </div>
      </ComponentPreview>

      <ComponentPreview id="morph-surface" title="Morph Surface" description="Morphing gradient blobs — lava lamp effect" code={`<MorphSurface colors={["#8b5cf6", "#06b6d4", "#f472b6"]} speed="medium" />`}>
        <div className="flex items-center justify-center py-6">
          <MorphBlob />
        </div>
      </ComponentPreview>

      <ComponentPreview id="branding-agent" title="Branding Agent" description="Agent identity card with capabilities" code={`<BrandingAgent name="NeuraForge Agent" role="UI Specialist" capabilities={["React", "Tailwind"]} />`}>
        <div className="flex justify-center">
          <AgentCard />
        </div>
      </ComponentPreview>

      <ComponentPreview id="sub-agent-starter" title="Sub Agent Starter" description="Agent boot-up sequence" code={`<SubAgentStarter agentName="CodeReviewer" onReady={() => {}} />`}>
        <div className="flex justify-center">
          <AgentBootup />
        </div>
      </ComponentPreview>

      <ComponentPreview id="multi-agent" title="Multi-Agent Workflow" description="Connected agent pipeline" code={`<EcommerceMultiAgent agents={[...]} />`}>
        <div className="flex justify-center py-4 overflow-x-auto">
          <MultiAgentFlow />
        </div>
      </ComponentPreview>
    </div>
  );
}
