// @ts-nocheck
"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const components = [
  { name: "AI Loader", description: "Animated loading indicator for AI processing states" },
  { name: "AI Message", description: "Chat message bubble with streaming text support" },
  { name: "AI Bubble Chat", description: "Floating chat interface with AI conversation support" },
  { name: "AI Branch", description: "Visual branching for multi-path AI conversations" },
  { name: "AI Citation", description: "Inline citation markers linking to source references" },
  { name: "AI Reasoning", description: "Expandable reasoning chain visualization" },
  { name: "AI Response", description: "Structured AI response with markdown rendering" },
  { name: "AI Sources", description: "Source attribution panel for AI-generated content" },
  { name: "AI Suggestions", description: "Quick suggestion chips for conversation prompts" },
  { name: "AI Task List", description: "Task breakdown with progress tracking for agent workflows" },
  { name: "AI Tool Call", description: "Visual representation of tool invocations by AI agents" },
  { name: "AI Context Meter", description: "Token usage and context window visualization" },
  { name: "AI Conversation", description: "Full conversation thread with role-based styling" },
];

export default function AIPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">AI Components</h1>
        <p className="text-muted-foreground mt-2">
          Purpose-built components for AI-powered interfaces, chat experiences, and agent workflows.
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
