// @ts-nocheck
"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const components = [
  { name: "Agent Avatar", description: "Animated avatar representing AI agent state and activity" },
  { name: "Siri Orb", description: "Pulsating orb visualization inspired by voice assistant interfaces" },
  { name: "Agentic Globe", description: "3D globe showing distributed agent activity and connections" },
  { name: "Branding Agent", description: "Visual identity generator agent with real-time previews" },
  { name: "Ecommerce Multi-Agent", description: "Multi-agent orchestration dashboard for e-commerce workflows" },
  { name: "Sub Agent Starter", description: "Template for spawning and visualizing sub-agent processes" },
  { name: "Morph Surface", description: "Fluid morphing surface that responds to agent computation states" },
];

export default function AgentVisualPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">Agent Visual</h1>
        <p className="text-muted-foreground mt-2">
          Visual representations for AI agents, orbs, globes, and multi-agent orchestration interfaces.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp) => (
          <motion.div
            key={comp.name}
            variants={fadeUp}
            className="rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-[hsl(var(--foreground))]">{comp.name}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{comp.description}</p>
            <div className="mt-4 rounded-lg bg-[hsl(var(--muted))] p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Interactive demo coming soon
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
