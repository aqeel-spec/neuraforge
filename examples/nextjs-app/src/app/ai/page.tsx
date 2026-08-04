// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";

// Dynamic imports to handle any resolution issues gracefully
import dynamic from "next/dynamic";

const AiLoader = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-loader").then(m => m.AiLoader ? { default: m.AiLoader } : m), { ssr: false });
const AiMessage = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-message").then(m => m.AiMessage ? { default: m.AiMessage } : m), { ssr: false });
const AiSuggestions = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-suggestions").then(m => m.AiSuggestions ? { default: m.AiSuggestions } : m), { ssr: false });
const AiContextMeter = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-context-meter").then(m => m.AiContextMeter ? { default: m.AiContextMeter } : m), { ssr: false });
const AiResponse = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-response").then(m => m.AiResponse ? { default: m.AiResponse } : m), { ssr: false });
const AiToolCall = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-tool-call").then(m => m.AiToolCall ? { default: m.AiToolCall } : m), { ssr: false });
const AiTaskList = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-task-list").then(m => m.AiTaskList ? { default: m.AiTaskList } : m), { ssr: false });
const AiSources = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-sources").then(m => m.AiSources ? { default: m.AiSources } : m), { ssr: false });
const AiReasoning = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-reasoning").then(m => m.AiReasoning ? { default: m.AiReasoning } : m), { ssr: false });
const AiBranch = dynamic(() => import("@neuraforge-ui/components/src/ai/ai-branch").then(m => m.AiBranch ? { default: m.AiBranch } : m), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AiComponentsPage() {
  const [selectedSuggestion, setSelectedSuggestion] = useState("");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">AI Components</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          13 purpose-built components for AI chat interfaces, reasoning chains, tool calls, and agent workflows.
        </p>
      </motion.div>

      {/* AI Loader */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-loader" title="AiLoader" description="Animated loading indicators for AI processing states">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <AiLoader variant="dots" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">dots</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AiLoader variant="pulse" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">pulse</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AiLoader variant="orbit" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">orbit</span>
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Message */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-message" title="AiMessage" description="Chat message bubbles with role-based styling">
          <div className="space-y-3 w-full">
            <AiMessage role="user" content="How do I install NeuraForge UI?" />
            <AiMessage role="assistant" content="Run `npx @neuraforge-ui/cli install pricing@1.0.0` to install any component. Each comes with exact dependencies and a SHA-256 checksum." />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Suggestions */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-suggestions" title="AiSuggestions" description="Quick prompt suggestion chips">
          <div className="w-full">
            <AiSuggestions
              suggestions={["Add a pricing section", "Build a dashboard layout", "Create a login form", "Show me dark mode components"]}
              onSelect={setSelectedSuggestion}
            />
            {selectedSuggestion && (
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Selected: "{selectedSuggestion}"</p>
            )}
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Context Meter */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-context-meter" title="AiContextMeter" description="Token/context usage visualization">
          <div className="w-full max-w-md space-y-4">
            <AiContextMeter used={6500} total={10000} label="Context usage" showPercentage />
            <AiContextMeter used={9200} total={10000} label="Near limit" showPercentage warningThreshold={80} />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Response */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-response" title="AiResponse" description="Streaming AI response with typewriter effect">
          <div className="w-full">
            <AiResponse
              content="NeuraForge UI provides 200+ accessible React components that AI agents can query directly over MCP. No hallucinated markup — every component is checksum-verified."
              copyable
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Tool Call */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-tool-call" title="AiToolCall" description="Tool/function call visualization">
          <div className="w-full">
            <AiToolCall
              name="search_components"
              parameters={{ query: "pricing", category: "marketing" }}
              result="Found 3 components: Pricing, ComparisonTable, PricingGradient"
              status="success"
              duration="120ms"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Task List */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-task-list" title="AiTaskList" description="AI-generated task list with progress">
          <div className="w-full max-w-md">
            <AiTaskList
              title="Setup Tasks"
              showProgress
              tasks={[
                { id: "1", label: "Install dependencies", completed: true },
                { id: "2", label: "Configure MCP server", completed: true },
                { id: "3", label: "Add first component", completed: false },
                { id: "4", label: "Run tests", completed: false },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Sources */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-sources" title="AiSources" description="Source attribution cards">
          <div className="w-full">
            <AiSources
              sources={[
                { id: "1", title: "NeuraForge Documentation", url: "https://neuraforge.dev/docs", snippet: "Complete API reference for all MCP operations" },
                { id: "2", title: "React Accessibility Guide", url: "https://react.dev/accessibility", snippet: "WCAG 2.2 patterns for React components" },
                { id: "3", title: "Tailwind CSS Docs", url: "https://tailwindcss.com/docs", snippet: "Utility-first CSS framework documentation" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Reasoning */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-reasoning" title="AiReasoning" description="Chain-of-thought reasoning display">
          <div className="w-full">
            <AiReasoning
              steps={[
                { id: "1", title: "Analyzing request", content: "User wants a pricing component", status: "complete" },
                { id: "2", title: "Searching catalog", content: "Found 3 pricing-related components", status: "complete" },
                { id: "3", title: "Selecting best match", content: "Comparing PricingGradient vs Pricing...", status: "thinking" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AI Branch */}
      <motion.div variants={fadeUp}>
        <ComponentPreview id="ai-branch" title="AiBranch" description="Branching conversation alternatives">
          <div className="w-full">
            <AiBranch
              branches={[
                { id: "a", label: "Concise", content: "Use PricingGradient for a modern look.", isActive: true },
                { id: "b", label: "Detailed", content: "I recommend PricingGradient because it uses gradient borders, supports 3 plans, and includes a highlighted tier." },
                { id: "c", label: "Code", content: "<PricingGradient plans={[...]} />" },
              ]}
              onSelect={() => {}}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
