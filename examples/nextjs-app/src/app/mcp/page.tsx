"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@neuraforge-ui/components/src/navigation-layout/index";
import { Alert } from "@neuraforge-ui/components/src/feedback/index";

// Simulated MCP operations and their responses
const mcpOperations = {
  list_components: {
    description: "Enumerate published components, filterable by category",
    example: {
      request: `{ "operation": "list_components", "params": { "category": "feedback" } }`,
      response: `{
  "components": [
    { "id": "dialog", "version": "1.0.0", "category": "feedback" },
    { "id": "alert", "version": "1.0.0", "category": "feedback" },
    { "id": "toast", "version": "1.0.0", "category": "feedback" },
    { "id": "loading-indicator", "version": "1.0.0", "category": "feedback" }
  ],
  "total": 4,
  "cursor": null
}`,
    },
  },
  get_component: {
    description: "Fetch exact source, props, dependencies, install steps, and checksum",
    example: {
      request: `{ "operation": "get_component", "params": { "id": "alert", "version": "1.0.0" } }`,
      response: `{
  "id": "alert",
  "version": "1.0.0",
  "category": "feedback",
  "source": "import type { HTMLAttributes, ReactNode } from \\"react\\";\\n\\nexport type AlertVariant = \\"info\\" | \\"success\\" ...",
  "props": ["title", "children", "variant", "dismissLabel", "onDismiss"],
  "dependencies": ["react"],
  "install": "npm install @neuraforge-ui/components",
  "checksum": "sha256-a1b2c3d4e5f6..."
}`,
    },
  },
  search_components: {
    description: "Rank components by intent, with a reproducible explanation",
    example: {
      request: `{ "operation": "search_components", "params": { "query": "pricing tiers" } }`,
      response: `{
  "results": [
    {
      "id": "pricing",
      "version": "1.0.0",
      "score": 0.95,
      "explanation": "Direct match: 'pricing' in component name and description"
    },
    {
      "id": "card",
      "version": "1.0.0", 
      "score": 0.42,
      "explanation": "Partial: commonly used to display tier information"
    }
  ]
}`,
    },
  },
  get_design_tokens: {
    description: "Read the token set so agent-written code stays visually consistent",
    example: {
      request: `{ "operation": "get_design_tokens", "params": { "version": "1.0.0" } }`,
      response: `{
  "version": "1.0.0",
  "tokens": {
    "color.brand.600": "#4c6ef5",
    "color.neutral.900": "#0f172a",
    "spacing.md": "1rem",
    "radius.lg": "0.5rem",
    "font.size.base": "1rem"
  },
  "checksum": "sha256-f1e2d3c4b5a6..."
}`,
    },
  },
  list_motion_presets: {
    description: "Browse Framer Motion animation presets",
    example: {
      request: `{ "operation": "list_motion_presets" }`,
      response: `{
  "presets": [
    { "id": "fade-in", "description": "Opacity 0→1" },
    { "id": "slide-up", "description": "Slide + fade from below" },
    { "id": "bounce", "description": "Spring entrance with overshoot" },
    { "id": "scale-in", "description": "Scale 0.9→1 with fade" }
  ]
}`,
    },
  },
  search_compositions: {
    description: "Find curated page sections by intent",
    example: {
      request: `{ "operation": "search_compositions", "params": { "intent": "hero with pricing below" } }`,
      response: `{
  "results": [
    {
      "id": "marketing-landing",
      "score": 0.91,
      "sections": ["hero", "features-grid", "pricing", "testimonials", "cta"],
      "explanation": "Full marketing landing page with hero and pricing sections"
    }
  ]
}`,
    },
  },
};

type OperationKey = keyof typeof mcpOperations;

export default function McpPage() {
  const [selected, setSelected] = useState<OperationKey>("list_components");

  const op = mcpOperations[selected];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-brand-700">
            ⚡ NeuraForge UI
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Components</Link>
            <Link href="/motion" className="text-slate-600 hover:text-slate-900">Motion</Link>
            <Link href="/tokens" className="text-slate-600 hover:text-slate-900">Tokens</Link>
            <span className="text-brand-700 font-medium">MCP</span>
          </nav>
        </div>
      </header>

      <Container className="py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">🤖 MCP Integration</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-3xl">
          NeuraForge UI exposes components via the{" "}
          <a href="https://modelcontextprotocol.io" className="text-brand-600 underline">
            Model Context Protocol
          </a>
          . AI agents call these operations to discover, inspect, and install components
          without hallucinating markup.
        </p>

        <Alert variant="info" title="How it works">
          An AI agent reads the developer&apos;s intent, calls a tool via MCP, and receives
          real, tested, accessible component source with exact dependencies and a SHA-256 checksum
          for integrity verification.
        </Alert>

        {/* MCP Setup */}
        <section className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Setup</h2>
          <div className="rounded-xl bg-slate-900 p-6 text-sm font-mono text-slate-300">
            <p className="text-slate-500 mb-2">// .cursor/mcp.json or claude_desktop_config.json</p>
            <pre>{`{
  "mcpServers": {
    "neuraforge": {
      "command": "node",
      "args": ["node_modules/@neuraforge-ui/mcp-core/dist/server.js"]
    }
  }
}`}</pre>
          </div>
        </section>

        {/* Operation Explorer */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Operations Explorer</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Operation List */}
            <div className="space-y-2">
              {(Object.keys(mcpOperations) as OperationKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                    selected === key
                      ? "bg-brand-600 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Operation Details */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1 font-mono">{selected}</h3>
                <p className="text-sm text-slate-600">{op.description}</p>
              </div>

              {/* Request */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Request
                </p>
                <div className="rounded-lg bg-slate-900 p-4 text-sm font-mono text-green-400 overflow-x-auto">
                  <pre>{op.example.request}</pre>
                </div>
              </div>

              {/* Response */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Response
                </p>
                <div className="rounded-lg bg-slate-900 p-4 text-sm font-mono text-blue-300 overflow-x-auto">
                  <pre>{op.example.response}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Flow Diagram */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Agent Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Intent", desc: "Developer says: \"add a pricing section\"" },
              { step: "2", title: "Search", desc: "Agent calls search_components(\"pricing tiers\")" },
              { step: "3", title: "Fetch", desc: "Agent calls get_component(\"pricing\", \"1.0.0\")" },
              { step: "4", title: "Install", desc: "Verified source + deps installed via CLI" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative rounded-xl border border-slate-200 p-4">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Integrity Note */}
        <section className="mt-12 rounded-xl bg-emerald-50 border border-emerald-200 p-6">
          <h3 className="font-semibold text-emerald-900 mb-2">🔐 Integrity Verification</h3>
          <p className="text-sm text-emerald-800">
            Every component artifact includes a SHA-256 checksum. The CLI verifies this checksum
            before writing any file to disk. If the checksum doesn&apos;t match, the install is aborted
            and rolled back. No hallucinated or tampered code touches your project.
          </p>
        </section>
      </Container>
    </div>
  );
}
