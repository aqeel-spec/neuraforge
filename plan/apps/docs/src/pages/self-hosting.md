---
title: Self-Hosting
description: Run the full NeuraForge UI stack offline
---

# Self-Hosting

Run Registry, Public API, docs, and MCP from local release artifacts.
No account, license key, quota, or internet connection required.

## Docker

```bash
docker compose up -d
```

The container exposes:

- Port 3000: Registry + Public API + Docs
- Health check: `GET /health`

## Configuration

```yaml
# docker-compose.yml environment variables
NEURAFORGE_PORT: 3000
NEURAFORGE_HOST: 0.0.0.0
NEURAFORGE_STORAGE: local
NEURAFORGE_DATA_DIR: /data
```

## Operations

- **Health**: `GET /health` — service versions, interface states
- **Backup**: Creates deterministic backup of all data
- **Restore**: Restores from backup with checksum verification
- **Upgrade**: Applies new release bundle with rollback support

## Offline MCP

The MCP server works identically offline:

```json
{
  "mcpServers": {
    "neuraforge-local": {
      "command": "docker",
      "args": ["exec", "neuraforge", "node", "packages/mcp-core/dist/server.js"]
    }
  }
}
```
