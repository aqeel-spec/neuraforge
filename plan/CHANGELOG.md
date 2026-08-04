# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-04

### Added

- Initial implementation of all 16 workspace packages
- 20 accessible React/Tailwind components across 6 categories
- Design token engine with Tailwind theme generation
- MCP operation registry and dispatcher (list, get, search, get_design_tokens)
- Transactional CLI with preview, apply, and rollback
- Immutable content-addressed release bundle builder
- Motion presets (fade-in, slide-up, bounce, scale-in) with Framer Motion
- 3D component framework with capability detection and viewport suspension
- Curated composition system with deterministic selection
- Public API (unauthenticated REST)
- Self-hosting runtime (offline-capable)
- Hosted gateway with quota management
- Conformance test harness (MVP + advanced)
- CI/CD with GitHub Actions
- Docker deployment support
- Property-based tests (fast-check)

### Security

- SHA-256 checksum verification before any content is shown or written
- Path traversal protection in CLI
- Entitlement-free access (no license keys, no paid tiers for artifacts)
