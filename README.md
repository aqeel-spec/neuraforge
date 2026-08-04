# NeuraForge UI

[![CI](https://github.com/neuraforge/ui/actions/workflows/ci.yml/badge.svg)](https://github.com/neuraforge/ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Components](https://img.shields.io/badge/Components-20-green.svg)](#components)
[![MCP](https://img.shields.io/badge/MCP-Ready-purple.svg)](#mcp-operations)

**A React + Tailwind component library that AI coding agents can query directly over MCP.**

Component libraries today are built for humans copy-pasting code. NeuraForge UI is built for the
way code is increasingly written: an agent reads the intent, calls a tool, and installs a real,
tested, accessible component instead of inventing one.

```
Developer:  "add a pricing section"
Agent:      → search_components("pricing tiers")
            → get_component("pricing", version: "1.0.0")
            ← real source + exact dependencies + install steps + checksum
```

No hallucinated markup. No drifting design system. The same artifact every time, verified by
checksum before it touches your project.

---

## Why this is different

|              | Typical component library | NeuraForge UI |
| ------------ | ------------------------- | ------------- |
| Discovery    | Browse docs, copy-paste | `list_components` / `search_components` over MCP |
| Install      | Manual paste, or a CLI that writes blindly | Transactional CLI: preview → confirm → apply → rollback |
| Integrity    | Trust the docs site | SHA-256 checksum verified before any content is shown |
| Versions     | "latest" | Exact published versions only, from immutable snapshots |
| Access       | Free tier, paid tier, license keys | Every artifact is public. No account, no key |
| Self-hosting | Rarely possible | First-class `docker compose up` |

## Quick Start

```bash
# Install components
npm install @neuraforge-ui/components @neuraforge-ui/tokens

# Or use the CLI
npx @neuraforge-ui/cli search "pricing"
npx @neuraforge-ui/cli install pricing@1.0.0
```

## MCP Setup (for AI Agents)

```json
{
  "mcpServers": {
    "neuraforge": {
      "command": "node",
      "args": ["node_modules/@neuraforge-ui/mcp-core/dist/server.js"]
    }
  }
}
```

## MCP Operations

| Operation | Purpose |
| --------- | ------- |
| `list_components` | Enumerate published components, filterable by category |
| `get_component` | Fetch exact source, props, dependencies, install steps, and checksum |
| `search_components` | Rank components by intent, with a reproducible explanation |
| `get_design_tokens` | Read the token set so agent-written code stays visually consistent |
| `list_motion_presets` | Browse Framer Motion animation presets |
| `search_compositions` | Find curated page sections by intent |

## Components

20 accessible components across 6 categories:

- **Navigation**: Navbar, Sidebar, Breadcrumbs, Tabs
- **Layout**: Container, Grid, Card, Hero, Footer
- **Forms**: TextField, Form
- **Feedback**: Dialog, Alert, Toast, LoadingIndicator
- **Data Display**: DataTable, Stat, Badge
- **Marketing**: Pricing, Testimonial

All components are WCAG 2.2 AA, keyboard navigable, and reduced-motion safe.

## Motion Presets

4 Framer Motion presets with full customization and reduced-motion support:
- `fade-in` — Opacity 0→1
- `slide-up` — Slide + fade
- `bounce` — Spring entrance
- `scale-in` — Scale + fade

## Repository Layout

```
plan/
├─ packages/
│  ├─ schemas/           Versioned public schemas + generated types
│  ├─ catalog-core/      Integrity, provenance, exact-version resolution
│  ├─ tokens/            Design tokens and Tailwind theme generation
│  ├─ components/        20 React + Tailwind components
│  ├─ motion/            Framer Motion presets and validation
│  ├─ three-d/           3D components with WebGL/WebGPU fallbacks
│  ├─ compositions/      Curated page section compositions
│  ├─ registry-builder/  Immutable release bundle builder
│  ├─ mcp-core/          MCP operation registry + stdio server
│  ├─ cli/               Transactional install with rollback
│  ├─ conformance/       Shared conformance test harness
│  ├─ self-hosting/      Run everything offline
│  ├─ telemetry/         Default-off, consent-gated
│  └─ release-policy/    Governance, prioritization, security
├─ apps/docs/            Documentation site (Astro)
├─ services/
│  ├─ public-api/        Unauthenticated REST API + serverless adapters
│  └─ hosted-gateway/    Optional managed capacity
└─ examples/nextjs-app/  Example integration
```

## Self-Hosting

```bash
docker compose up -d
# Registry + API + Docs + MCP on port 3000
```

No NeuraForge account, license key, or internet required.

## Development

```bash
cd plan
npm install
npm run check     # format, lint, typecheck, unit + integration tests
npm run test:property  # fast-check property tests
```

## The One Commitment

The optional hosted service sells **managed capacity only**. It will never change which
components exist, which operations are available, what the public Registry serves, or what you
can self-host. If a component is in NeuraForge UI, it is MIT-licensed and yours.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security reports go through
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
