// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { AiLoader } from "@neuraforge-ui/components/src/ai/ai-loader";
import { AiMessage } from "@neuraforge-ui/components/src/ai/ai-message";
import { AiSuggestions } from "@neuraforge-ui/components/src/ai/ai-suggestions";
import { AiContextMeter } from "@neuraforge-ui/components/src/ai/ai-context-meter";
import { AiResponse } from "@neuraforge-ui/components/src/ai/ai-response";
import { AiToolCall } from "@neuraforge-ui/components/src/ai/ai-tool-call";
import { AiTaskList } from "@neuraforge-ui/components/src/ai/ai-task-list";
import { AiSources } from "@neuraforge-ui/components/src/ai/ai-sources";
import { AiReasoning } from "@neuraforge-ui/components/src/ai/ai-reasoning";
import { AiBranch } from "@neuraforge-ui/components/src/ai/ai-branch";
import { AiCitation } from "@neuraforge-ui/components/src/ai/ai-citation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function AiComponentsPage() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-white">AI Components</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Purpose-built components for AI-powered interfaces. Streaming responses,
            tool calls, reasoning traces, and more.
          </p>
        </motion.header>

        {/* AiLoader */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <ComponentPreview
            id="ai-loader"
            title="AiLoader"
            description="Animated loading indicators for AI processing states. Three variants: dots, pulse, and orbit."
            code={`<AiLoader variant="dots" />\n<AiLoader variant="pulse" />\n<AiLoader variant="orbit" />`}
          >
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <AiLoader variant="dots" />
                <span className="text-xs text-gray-500">dots</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AiLoader variant="pulse" />
                <span className="text-xs text-gray-500">pulse</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AiLoader variant="orbit" />
                <span className="text-xs text-gray-500">orbit</span>
              </div>
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiMessage */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          <ComponentPreview
            id="ai-message"
            title="AiMessage"
            description="Chat message bubbles for user and assistant roles with appropriate styling."
            code={`<AiMessage role="user" content="How do I add a pricing section to my landing page?" />\n<AiMessage role="assistant" content="I found a Pricing component in the registry. Let me install it for you with the correct dependencies." />`}
          >
            <div className="space-y-4 w-full">
              <AiMessage
                role="user"
                content="How do I add a pricing section to my landing page?"
              />
              <AiMessage
                role="assistant"
                content="I found a Pricing component in the registry. Let me install it for you with the correct dependencies."
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiSuggestions */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <ComponentPreview
            id="ai-suggestions"
            title="AiSuggestions"
            description="Interactive suggestion chips that guide users toward common actions."
            code={`<AiSuggestions\n  suggestions={[\n    "Add a hero section",\n    "Install dark mode",\n    "Create a contact form",\n    "Show available components"\n  ]}\n  onSelect={(s) => setSelectedSuggestion(s)}\n/>`}
          >
            <div className="space-y-3 w-full">
              <AiSuggestions
                suggestions={[
                  "Add a hero section",
                  "Install dark mode",
                  "Create a contact form",
                  "Show available components",
                ]}
                onSelect={(s) => setSelectedSuggestion(s)}
              />
              {selectedSuggestion && (
                <p className="text-sm text-gray-400">
                  Selected: <span className="text-white">{selectedSuggestion}</span>
                </p>
              )}
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiContextMeter */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <ComponentPreview
            id="ai-context-meter"
            title="AiContextMeter"
            description="Visual indicator of context window usage to help users understand token consumption."
            code={`<AiContextMeter used={6500} total={10000} />`}
          >
            <div className="w-full max-w-md">
              <AiContextMeter used={6500} total={10000} />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiResponse */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
          <ComponentPreview
            id="ai-response"
            title="AiResponse"
            description="Formatted AI response container with optional copy-to-clipboard functionality."
            code={`<AiResponse\n  content="The Pricing component supports 3 tiers by default. Each tier accepts a title, price, features array, and an optional highlighted prop for the recommended plan."\n  copyable={true}\n/>`}
          >
            <div className="w-full">
              <AiResponse
                content="The Pricing component supports 3 tiers by default. Each tier accepts a title, price, features array, and an optional highlighted prop for the recommended plan."
                copyable={true}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiToolCall */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <ComponentPreview
            id="ai-tool-call"
            title="AiToolCall"
            description="Displays MCP tool invocations with parameters and execution status."
            code={`<AiToolCall\n  name="searchComponents"\n  status="success"\n  params={{ query: "pricing" }}\n/>`}
          >
            <div className="w-full">
              <AiToolCall
                name="searchComponents"
                status="success"
                params={{ query: "pricing" }}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiTaskList */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}>
          <ComponentPreview
            id="ai-task-list"
            title="AiTaskList"
            description="Progress tracker for multi-step AI operations with completion states."
            code={`<AiTaskList\n  tasks={[\n    { id: "1", label: "Search component registry", status: "completed" },\n    { id: "2", label: "Verify checksum integrity", status: "completed" },\n    { id: "3", label: "Install dependencies", status: "pending" },\n    { id: "4", label: "Write component to project", status: "pending" }\n  ]}\n/>`}
          >
            <div className="w-full">
              <AiTaskList
                tasks={[
                  { id: "1", label: "Search component registry", status: "completed" },
                  { id: "2", label: "Verify checksum integrity", status: "completed" },
                  { id: "3", label: "Install dependencies", status: "pending" },
                  { id: "4", label: "Write component to project", status: "pending" },
                ]}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiSources */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}>
          <ComponentPreview
            id="ai-sources"
            title="AiSources"
            description="Reference cards linking to documentation or registry sources used in a response."
            code={`<AiSources\n  sources={[\n    { title: "Pricing Component Docs", url: "https://neuraforge.dev/components/pricing", type: "documentation" },\n    { title: "Design Tokens Reference", url: "https://neuraforge.dev/tokens", type: "documentation" },\n    { title: "MCP Integration Guide", url: "https://neuraforge.dev/guides/mcp", type: "guide" }\n  ]}\n/>`}
          >
            <div className="w-full">
              <AiSources
                sources={[
                  {
                    title: "Pricing Component Docs",
                    url: "https://neuraforge.dev/components/pricing",
                    type: "documentation",
                  },
                  {
                    title: "Design Tokens Reference",
                    url: "https://neuraforge.dev/tokens",
                    type: "documentation",
                  },
                  {
                    title: "MCP Integration Guide",
                    url: "https://neuraforge.dev/guides/mcp",
                    type: "guide",
                  },
                ]}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiReasoning */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9}>
          <ComponentPreview
            id="ai-reasoning"
            title="AiReasoning"
            description="Transparent reasoning trace showing the agent's thought process step by step."
            code={`<AiReasoning\n  steps={[\n    { id: "1", text: "User wants a pricing section — searching registry", status: "complete" },\n    { id: "2", text: "Found Pricing@1.0.0 with 3 tier layout", status: "complete" },\n    { id: "3", text: "Checking project dependencies for conflicts...", status: "thinking" }\n  ]}\n/>`}
          >
            <div className="w-full">
              <AiReasoning
                steps={[
                  {
                    id: "1",
                    text: "User wants a pricing section — searching registry",
                    status: "complete",
                  },
                  {
                    id: "2",
                    text: "Found Pricing@1.0.0 with 3 tier layout",
                    status: "complete",
                  },
                  {
                    id: "3",
                    text: "Checking project dependencies for conflicts...",
                    status: "thinking",
                  },
                ]}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiBranch */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10}>
          <ComponentPreview
            id="ai-branch"
            title="AiBranch"
            description="Decision branch visualization for when the agent considers multiple approaches."
            code={`<AiBranch\n  branches={[\n    { id: "a", label: "Install from registry", description: "Use the verified Pricing@1.0.0 artifact", recommended: true },\n    { id: "b", label: "Generate custom", description: "Create a bespoke pricing section from tokens" },\n    { id: "c", label: "Use composition", description: "Combine Hero + Card components into a pricing layout" }\n  ]}\n/>`}
          >
            <div className="w-full">
              <AiBranch
                branches={[
                  {
                    id: "a",
                    label: "Install from registry",
                    description: "Use the verified Pricing@1.0.0 artifact",
                    recommended: true,
                  },
                  {
                    id: "b",
                    label: "Generate custom",
                    description: "Create a bespoke pricing section from tokens",
                  },
                  {
                    id: "c",
                    label: "Use composition",
                    description: "Combine Hero + Card components into a pricing layout",
                  },
                ]}
              />
            </div>
          </ComponentPreview>
        </motion.div>

        {/* AiCitation */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={11}>
          <ComponentPreview
            id="ai-citation"
            title="AiCitation"
            description="Inline citation markers that link response text to source references."
            code={`<AiCitation\n  text="The Pricing component uses CSS Grid for responsive layouts [1] and supports up to 5 tiers with automatic column adjustment."\n  citations={[\n    { id: 1, source: "Pricing Component API Reference", url: "https://neuraforge.dev/api/pricing" }\n  ]}\n/>`}
          >
            <div className="w-full">
              <AiCitation
                text="The Pricing component uses CSS Grid for responsive layouts [1] and supports up to 5 tiers with automatic column adjustment."
                citations={[
                  {
                    id: 1,
                    source: "Pricing Component API Reference",
                    url: "https://neuraforge.dev/api/pricing",
                  },
                ]}
              />
            </div>
          </ComponentPreview>
        </motion.div>
      </div>
    </div>
  );
}
