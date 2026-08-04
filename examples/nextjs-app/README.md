# NeuraForge UI + Next.js Example

This example shows how to use NeuraForge UI components in a Next.js app.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's Demonstrated

- Importing components from `@neuraforge/components`
- Using design tokens from `@neuraforge/tokens`
- Applying motion presets from `@neuraforge/motion`
- All components are accessible and respect `prefers-reduced-motion`

## MCP Integration

To let your AI agent install components automatically, add to your editor's MCP config:

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

Then ask: "Add a pricing section" — the agent will call `search_components("pricing")` and install the exact verified source.
