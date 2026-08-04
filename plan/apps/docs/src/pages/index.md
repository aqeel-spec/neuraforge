---
title: NeuraForge UI Documentation
description: Component library for AI coding agents over MCP
---

# NeuraForge UI

A React + Tailwind component library that AI coding agents can query directly over MCP.

## Quick Start

```bash
npm install @neuraforge/components @neuraforge/tokens
```

## For AI Agents

Configure your MCP client:

```json
{
  "mcpServers": {
    "neuraforge": {
      "command": "node",
      "args": ["node_modules/@neuraforge/mcp-core/dist/server.js"]
    }
  }
}
```

Then your agent can:
- `list_components` — Browse the 20-component catalog
- `get_component` — Get exact source + install steps + checksum
- `search_components` — Find components by intent
- `get_design_tokens` — Stay visually consistent

## Navigation

- [Components](/components) — 20 accessible components across 6 categories
- [Design Tokens](/tokens) — Color, typography, spacing, Tailwind theme
- [Motion](/motion) — Framer Motion presets with reduced-motion support
- [3D Components](/three-d) — WebGL/WebGPU with first-class fallbacks
- [Compositions](/compositions) — Curated page sections
- [CLI](/cli) — Transactional install with preview and rollback
- [API Reference](/api) — Public REST API
- [Self-Hosting](/self-hosting) — Run everything offline
