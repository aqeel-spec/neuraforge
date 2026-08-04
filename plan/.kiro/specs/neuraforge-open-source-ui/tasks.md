# Implementation Plan: NeuraForge Open-Source UI

## Overview

Implement NeuraForge UI as a TypeScript monorepo whose immutable release bundle is the single source for React/Tailwind components, tokens, Registry, Public API, CLI, npm, MCP, documentation, and self-hosting. Sequence work around an open-source-first 15–20 component MVP, then add optional hosted operational capacity without artifact entitlements, and only then add public motion, 3D, and curated composition capabilities. Testing subtasks are optional execution items but preserve the design's complete correctness-property coverage.

## Tasks

- [-] 1. Establish the TypeScript monorepo and public artifact contracts
  - [x] 1.1 Scaffold the workspace and package boundaries
    - Create the TypeScript workspace for schemas, catalog core, tokens, components, Registry builder, CLI, MCP core, conformance, release policy, docs, Public API, self-hosting, and hosted gateway.
    - Configure pinned formatting, static analysis, unit, integration, React, and fast-check tooling without introducing paid/private package paths.
    - _Requirements: 1.1, 1.3, 1.9, 1.10, 2.3, 12.1, 12.14_
  - [x] 1.2 Implement versioned common schemas and generated TypeScript types
    - Define closed schemas for artifact references, files, checksums, provenance, compatibility, releases, quality evidence, errors, and access classification.
    - Generate typed `Result`, `ErrorEnvelope`, and field-error contracts shared by every adapter.
    - _Requirements: 1.4, 1.6, 1.8, 7.10, 11.11, 12.2_
  - [-] 1.3 Implement entitlement-free access and provenance validation
    - Reject private, premium, paid-only, license-key, incompatible-license, unresolved-source, and incomplete-provenance records.
    - Traverse direct and transitive release dependencies/assets and retain auditable dependency replacement records.
    - _Requirements: 1.2, 1.4–1.12, 11.11, 18.4, 18.5_
  - [-]* 1.4 Write the property test for entitlement-free artifact access
    - **Property 1: Artifact access policy is entitlement-free**
    - **Validates: Requirements 1.2, 1.9, 1.10, 1.11, 18.4, 18.5**
  - [-]* 1.5 Write the property test for release provenance closure
    - **Property 2: Release provenance graph is complete and compatible**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.8, 3.5, 4.7, 5.2, 5.22, 11.11**
  - [-] 1.6 Implement immutable catalog reading, exact version resolution, and canonical bytes
    - Normalize paths/line endings, sort JSON keys and file entries, length-delimit bytes, and calculate declared SHA-256 checksums.
    - Resolve only exact versions from immutable snapshots and return support status, migrations, or published alternatives for misses.
    - _Requirements: 7.1, 7.9, 7.10, 8.7, 13.9–13.12_
  - [-]* 1.7 Write the property test for exact published-version resolution
    - **Property 20: Version resolution returns exact published artifacts only**
    - **Validates: Requirements 4.9, 7.1, 8.7, 13.12**
  - [-]* 1.8 Write the property test for canonicalization and projection parity
    - **Property 21: Canonicalization and cross-channel parity are deterministic**
    - **Validates: Requirements 7.9, 7.10**

- [-] 2. Build the Design Token and Tailwind theme engine
  - [-] 2.1 Define and publish token, Brand Config, and supported-version schemas
    - Cover color, typography, spacing, sizing, elevation, borders, breakpoints, motion, reference DAGs, ordering semantics, and external/distributed fonts.
    - _Requirements: 4.1, 4.2, 4.6–4.9_
  - [-] 2.2 Implement token import/export, validation, and theme generation
    - Accumulate all independent field/reference errors, preserve external font references without copying bytes, and emit Tailwind-compatible output only for supported versions.
    - _Requirements: 4.3–4.5, 4.8–4.10_
  - [-]* 2.3 Write the property test for token serialization round trips
    - **Property 7: Token serialization round trip preserves meaning**
    - **Validates: Requirements 4.2, 4.5, 12.4**
  - [-]* 2.4 Write the property test for generated theme fidelity
    - **Property 8: Theme generation preserves validated brand intent**
    - **Validates: Requirements 4.3, 4.8**
  - [-]* 2.5 Write the property test for exhaustive version-aware token validation
    - **Property 9: Token validation is exhaustive and version-aware**
    - **Validates: Requirements 4.4, 4.9, 12.5**
  - [-]* 2.6 Add supported-Tailwind compilation and token example tests
    - Compile generated themes against each configured supported Tailwind version and test known valid, invalid, cycle, ordering, and external-font examples.
    - _Requirements: 4.10, 12.4, 12.5_

- [-] 3. Implement the focused accessible React/Tailwind MVP component catalog
  - [-] 3.1 Create the component authoring framework and accessibility contracts
    - Implement editable React/Tailwind source conventions, typed props, examples, state/behavior maps, primitive provenance, capability detection, and functional fallback interfaces.
    - _Requirements: 3.1–3.6, 10.1–10.4, 10.7, 10.8_
  - [-] 3.2 Implement the MVP navigation and layout components
    - Add polished components such as navbar, sidebar, breadcrumbs/tabs, footer, container, grid, card, and hero while keeping the final total within 15–20.
    - Include documented keyboard, focus, responsive, state, and fallback behavior for each applicable contract.
    - _Requirements: 2.1, 2.2, 3.1, 3.8, 10.2–10.4, 10.8_
  - [-] 3.3 Implement the MVP forms and feedback components
    - Add accessible input/form controls plus dialog/alert/toast/loading feedback components, using exact-version compatible primitives where needed.
    - Implement validation, error/status announcements, disabled/loading states, keyboard/pointer parity, and visible focus.
    - _Requirements: 2.1, 2.2, 3.1, 3.5, 10.2–10.4, 10.8_
  - [-] 3.4 Implement the MVP data-display and marketing components
    - Add table/stat/badge/avatar and CTA/pricing/testimonial/FAQ/feature patterns as needed to reach 15–20 components across all six categories.
    - Preserve content and primary actions under optional browser-capability fallbacks.
    - _Requirements: 2.1, 2.2, 3.1, 3.8, 10.2–10.4_
  - [-] 3.5 Implement component metadata validation and Registry projection
    - Require exact identity/version/files/dependencies, prop domains, all behavior keys, primitive/provenance choice, fallback choice, examples, and performance budget references.
    - _Requirements: 3.2–3.7, 12.3, 12.6_
  - [-]* 3.6 Write the property test for total component metadata contracts
    - **Property 6: Component metadata is a total contract**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
  - [-]* 3.7 Add component behavior, fallback, and accessibility tests
    - Use React Testing Library, user-event, and accessibility automation for every declared state, transition, keyboard/pointer path, focus behavior, validation/error/status behavior, and fallback.
    - Add fixtures for manual review records and accessibility regression records keyed to exact versions.
    - _Requirements: 3.8, 10.1–10.9, 12.3_

- [-] 4. Build release policy, Registry snapshots, Public API, and npm distribution
  - [-] 4.1 Implement the Registry builder and immutable release bundle
    - Validate schemas, source paths, exact references, licenses, docs links, checksums, evidence, release manifests, notices, build instructions, and package contents.
    - Emit one content-addressed snapshot used unchanged by Registry, API, npm, CLI, MCP, and docs.
    - _Requirements: 1.4–1.8, 2.4, 7.1–7.3, 7.9, 7.10, 11.11_
  - [-] 4.2 Implement fail-closed quality classification and approval state
    - Aggregate required check results, budgets, exceptions, and manual approval into rejected, experimental, approved, or stable status; never stabilize absent, malformed, failed, or excepted evidence.
    - _Requirements: 2.5, 3.7, 5.15, 5.20, 6.10, 9.6, 10.1, 10.5, 11.7, 11.8, 12.7, 12.9–12.14_
  - [-]* 4.3 Write the property test for fail-closed stable classification
    - **Property 3: Stable classification is fail-closed**
    - **Validates: Requirements 2.5, 3.7, 5.15, 5.20, 6.10, 9.6, 10.1, 10.5, 11.7, 11.8, 12.7, 12.9, 12.10, 12.13**
  - [-] 4.4 Implement MVP inventory and required-surface validation
    - Enforce 15–20 stable components, all six categories, and presence of tokens, Registry, CLI, npm, MVP MCP, docs, and contribution workflow before MVP approval.
    - _Requirements: 2.1–2.5_
  - [-]* 4.5 Write the property test for constrained and complete MVP inventory
    - **Property 4: MVP inventory is constrained and complete**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [-] 4.6 Implement deterministic release prioritization
    - Validate impact, effort, accessibility risk, security risk, and demand evidence; apply published numeric directions, weights, missing-evidence values, and stable-ID tie-breaking.
    - _Requirements: 2.6–2.8, 16.5_
  - [-]* 4.7 Write the property test for deterministic prioritization
    - **Property 5: Prioritization is complete and deterministic**
    - **Validates: Requirements 2.6, 2.7, 2.8**
  - [-] 4.8 Implement unauthenticated exact-version Public API and npm package output
    - Serve `GET`/`HEAD` Registry metadata and artifacts without identity, and package the matching exact React components and tokens for the public npm registry.
    - Include deterministic cursor validation and immutable version responses.
    - _Requirements: 7.2, 7.3, 13.9, 13.10, 14.3, 18.18_
  - [-] 4.9 Implement Semantic Version, support-window, deprecation, and migration policy
    - Classify changes into major/minor/patch/prerelease versions and require machine/human migrations for incompatible schemas/operations and stable deprecations.
    - Reject mutation of supported releases and direct corrections to new versions.
    - _Requirements: 13.1–13.13_
  - [-]* 4.10 Write the property test for change-impact Semantic Version selection
    - **Property 31: Semantic version selection matches change impact**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
  - [-]* 4.11 Write the property test for supported-release immutability
    - **Property 32: Published supported releases are immutable**
    - **Validates: Requirements 13.9, 13.10, 13.11**
  - [-]* 4.12 Write the property test for incompatible-change migrations
    - **Property 33: Incompatible changes require migrations**
    - **Validates: Requirements 13.7, 13.8, 13.13**
  - [-] 4.13 Implement quality evidence, compatibility matrices, and reproducible gate orchestration
    - Generate per-check results, behavior coverage links, runtime/bundle budgets, browser/surface results, pinned environments, commands, and exception records.
    - _Requirements: 10.5, 10.6, 11.7, 11.8, 12.1–12.16_
  - [-]* 4.14 Write the property test for complete behavior and environment evidence
    - **Property 30: Quality evidence covers declared behavior and environments**
    - **Validates: Requirements 12.2, 12.3, 12.6, 12.8, 12.14**
  - [-]* 4.15 Add cross-channel release-bundle integration tests
    - Retrieve one fixture through Registry, API, npm tarball inspection, and catalog adapters; compare canonical source, dependencies, compatibility, provenance, and checksums.
    - _Requirements: 2.4, 7.3, 7.9, 11.11_

- [-] 5. Implement the transactional open-source CLI
  - [-] 5.1 Implement search, inspect, and pure installation preview commands
    - Resolve verified exact artifacts and report Registry location, checksums, dependency/file changes, conflicts, target preconditions, and ordered rollback actions without writing target files.
    - _Requirements: 7.4, 7.5, 7.11_
  - [-]* 5.2 Write the property test for complete and pure CLI previews
    - **Property 23: CLI preview is complete and pure**
    - **Validates: Requirements 7.5**
  - [-] 5.3 Implement explicit confirmation and conflict-safe installation
    - Revalidate plan/target preconditions and preserve every conflicting file unless the displayed plan has explicit overwrite approval.
    - _Requirements: 7.6, 7.7_
  - [-]* 5.4 Write the property test for authorized CLI writes and conflict preservation
    - **Property 24: CLI writes require authorization and preserve unapproved conflicts**
    - **Validates: Requirements 7.6, 7.7**
  - [-] 5.5 Implement journaled apply and deterministic rollback
    - Back up affected files, apply path-confined operations, verify postconditions, and run the displayed rollback after injected or real apply failures with residual mismatch reporting.
    - _Requirements: 7.8, 11.9, 11.10_
  - [-]* 5.6 Write the property test for rollback after any failed install step
    - **Property 25: Failed installs follow the displayed rollback**
    - **Validates: Requirements 7.8**
  - [-]* 5.7 Add CLI security and transaction tests
    - Test path traversal/archive escape, checksum substitution, changed preconditions, every write-step failure, rollback, and absence of telemetry by default.
    - _Requirements: 7.7, 7.8, 7.11, 11.9, 11.10, 15.1_

- [-] 6. Implement public, side-effect-free MCP discovery
  - [-] 6.1 Define the versioned public MCP operation registry and dispatcher
    - Add `list_components`, `get_component`, `search_components`, and `get_design_tokens` with public input/output schemas, error codes, examples, validation, and pagination contracts.
    - Keep the dispatcher independent of hosted auth, billing, plans, quotas, and caller filesystem mutation.
    - _Requirements: 4.6, 8.1, 8.2, 8.11, 8.12_
  - [-]* 6.2 Write the property test for complete MCP operation contracts
    - **Property 26: Every registered MCP operation has a complete public contract**
    - **Validates: Requirements 8.2**
  - [-] 6.3 Implement deterministic MCP list/search pagination and ranking
    - Normalize filters/queries, apply published selection rules, stable-ID tie-breaks, version-bound cursors, scores, explanations, and deterministic next pages.
    - _Requirements: 8.3, 8.5, 8.6_
  - [-]* 6.4 Write the property test for sound, complete, replayable MCP pagination
    - **Property 27: MCP pagination is sound, complete, and replayable**
    - **Validates: Requirements 8.3, 8.5, 8.6**
  - [-] 6.5 Implement verified MCP retrieval, validation guards, and lineage
    - Return component source/metadata/dependencies/install/checksum/Registry/provenance and token schema/support data only after input and integrity validation.
    - Return structured not-found, availability, integrity, and all-field validation errors; attach exact lineage to generated/customized outputs.
    - _Requirements: 8.4, 8.7–8.10_
  - [-]* 6.6 Write the property test for validate-before-read and complete lineage
    - **Property 28: MCP validates before retrieval and preserves lineage**
    - **Validates: Requirements 8.8, 8.10**
  - [-] 6.7 Implement shared integrity guards for CLI and MCP
    - Reject mismatched or uncomputable content before verified presentation, MCP payload return, or installation mutation, using the common integrity error envelope.
    - _Requirements: 7.11, 8.9, 11.9, 11.10_
  - [-]* 6.8 Write the property test that unverified content is never used
    - **Property 22: Unverified content is never presented or applied**
    - **Validates: Requirements 7.11, 8.9, 11.9, 11.10**
  - [-]* 6.9 Add MCP transport and filesystem-isolation conformance tests
    - Run common operation cases over stdio and HTTP against a fixed public Registry snapshot and assert no caller-project file change or subscription dependency.
    - _Requirements: 8.1–8.12, 14.3, 14.10_

- [-] 7. Implement public documentation, policy records, governance, and privacy controls
  - [-] 7.1 Build the versioned public documentation application and search index
    - Generate public pages for every Public Surface with exact source/version/compatibility links, examples, API metadata, accessibility reviews, and same-release change detection.
    - Index titles, stable IDs, categories, versions, API terms, and content; require no authentication or payment.
    - _Requirements: 9.1–9.10, 10.6, 17.1, 17.4, 17.5_
  - [-] 7.2 Implement tutorial/reference and migration validation
    - Treat artifact references as exact-version foreign keys and block missing source/docs/compatibility links, tool versions, licenses, or required migration material.
    - _Requirements: 9.4, 9.5, 9.8, 9.9, 17.5, 17.6_
  - [-]* 7.3 Write the property test for release-consistent documentation references
    - **Property 29: Documentation references are release-consistent**
    - **Validates: Requirements 9.2, 9.4, 9.5, 9.8, 9.9, 17.5, 17.6**
  - [-] 7.4 Implement machine-validated security and community policy records
    - Add versioned records and public renderers for supported releases, private-report routing metadata, threat model, advisories, contribution terms, governance, maintainers, code of conduct, proposals, decisions, corrections, and roadmap.
    - Keep confidential security/conduct data in restricted schemas while publishing safe lifecycle outputs.
    - _Requirements: 10.9, 11.1–11.6, 11.12, 16.1, 16.7–16.9, 16.12_
  - [-] 7.5 Implement governance proposal and decision validation
    - Validate completeness, calendar review/decision deadlines, reviewers, authority, conflicts, evidence, outcomes, delays, replacement deadlines, correction paths, and public nomination/appeal metadata.
    - _Requirements: 16.2–16.6, 16.9_
  - [-]* 7.6 Write the property test for complete governance records
    - **Property 38: Governance validation and records are complete**
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.5, 16.6**
  - [-] 7.7 Implement append-only roadmap and linked correction storage
    - Enforce exactly one roadmap state and state-change date while preserving original records and linking reasoned, attributed, dated corrections.
    - _Requirements: 16.10, 16.11_
  - [-]* 7.8 Write the property test for unambiguous append-only governance history
    - **Property 39: Governance history and roadmap are append-only and unambiguous**
    - **Validates: Requirements 16.10, 16.11**
  - [-] 7.9 Implement closed publication-scope validation
    - Accept only NeuraForge UI docs, tutorials, examples, changelogs, migrations, and announcements; classify general-blog and unrelated publishing records outside the UI roadmap.
    - _Requirements: 17.1–17.4_
  - [-]* 7.10 Write the property test for the closed publishing boundary
    - **Property 40: Publishing scope is closed**
    - **Validates: Requirements 17.1, 17.2, 17.3**
  - [-] 7.11 Implement default-off telemetry consent and allowlist sinks
    - Add disclosure, schema-version consent receipts, local validation, bounded retention, withdrawal-before-acknowledgement, re-consent on schema change, and receipt-based deletion.
    - Exclude source, prompts, Brand Config, paths, secrets, credentials, and Personal Data from schemas and transmission.
    - _Requirements: 15.1–15.11_
  - [-]* 7.12 Write the property test for version-bound telemetry consent
    - **Property 36: Telemetry is consent-gated and version-bound**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.7, 15.8**
  - [-]* 7.13 Write the property test for minimized fail-closed telemetry
    - **Property 37: Telemetry is minimized, bounded, and fail-closed**
    - **Validates: Requirements 15.4, 15.5, 15.6, 15.11**
  - [-]* 7.14 Add anonymous documentation, policy, accessibility, and privacy integration tests
    - Crawl public pages without credentials, validate search/version links, run documentation accessibility checks, test advisory/support links, and prove forbidden telemetry canaries never reach a sink.
    - _Requirements: 9.3, 9.6, 9.10, 11.1–11.6, 15.1–15.11, 16.12, 17.4_

- [-] 8. Implement operationally independent self-hosting
  - [-] 8.1 Build the self-host configuration, process composition, and offline startup guard
    - Validate operator-controlled endpoints, local/S3-compatible storage, credential references, retention, enabled interfaces, TLS/proxy, and resource limits before binding listeners.
    - Serve Registry, Public API, docs, and MCP from local release artifacts with no NeuraForge account, license key, quota, or required egress.
    - _Requirements: 1.8, 1.12, 14.1–14.6, 14.11, 14.12_
  - [-]* 8.2 Write the property test for validate-before-exposure self-host configuration
    - **Property 34: Self-host configuration validates before exposure**
    - **Validates: Requirements 14.4, 14.5, 14.6, 14.12**
  - [-] 8.3 Implement self-host health, backup, restore, upgrade, rollback, and verification
    - Report service/Registry/config versions and per-interface state without secrets; verify all checksums and enumerate mismatches after recovery operations.
    - _Requirements: 14.7–14.9_
  - [-]* 8.4 Write the property test for complete self-host health and recovery evidence
    - **Property 35: Self-host health and recovery evidence is complete**
    - **Validates: Requirements 14.7, 14.9**
  - [-]* 8.5 Add egress-blocked self-host parity and recovery tests
    - Run shared Registry/API/docs/MCP conformance cases offline, exercise backup/restore/upgrade/rollback, and compare exact public release behavior.
    - _Requirements: 14.2, 14.3, 14.8–14.12_

- [-] 9. Add the optional hosted MCP capacity boundary
  - [-] 9.1 Implement isolated hosted pricing, subscription, billing-cycle, and quota models
    - Create immutable Pricing Versions, the exact Starter USD 9/500, Pro USD 29/3,000, and Team USD 79/10,000 initial values, monthly cycles, daily UTC windows, subscriptions, and the strict quota ledger allowlist.
    - Keep hosted identity/billing/quota stores outside Registry and MCP core contracts.
    - _Requirements: 18.1–18.6, 18.12, 18.17, 18.20_
  - [-] 9.2 Implement the authenticated gateway and plan-independent MCP dispatch adapter
    - Authenticate hosted requests, reject inactive subscriptions, classify excluded endpoints, reserve quota transactionally, dispatch through the public MCP core, and add only operational usage metadata.
    - _Requirements: 18.1, 18.4, 18.5, 18.7–18.10, 18.18_
  - [-]* 9.3 Write the property test for plan-independent core results
    - **Property 41: Hosted core results are plan-independent**
    - **Validates: Requirements 18.4, 18.5**
  - [-] 9.4 Implement exactly-once transactional request accounting
    - Use unique account/request IDs so duplicate deliveries count once, distinct retries count separately, post-dispatch structured errors count, and pre-dispatch/excluded requests do not.
    - _Requirements: 18.7–18.11_
  - [-]* 9.5 Write the property test for exactly-once hosted request accounting
    - **Property 42: Hosted request accounting is exactly once and correctly classified**
    - **Validates: Requirements 18.7, 18.8, 18.9, 18.10, 18.11**
  - [-] 9.6 Implement deterministic UTC quota windows
    - Assign timestamps to half-open UTC-day windows and calculate the exact next-midnight reset for all responses and inspections.
    - _Requirements: 18.12–18.14_
  - [-]* 9.7 Write the property test for UTC-day quota boundaries
    - **Property 43: Quota windows are UTC-day bounded**
    - **Validates: Requirements 18.12**
  - [-] 9.8 Implement quota exhaustion and no-overage behavior
    - Reject counted operations at the limit before dispatch with complete `quota_exceeded` data while leaving the published monthly charge unchanged.
    - _Requirements: 18.6, 18.15, 18.16_
  - [-]* 9.9 Write the property test for non-dispatching quota exhaustion
    - **Property 44: Quota exhaustion prevents dispatch without changing charge**
    - **Validates: Requirements 18.6, 18.15, 18.16**
  - [-] 9.10 Implement hosted response and quota-inspection metadata
    - Return plan, Pricing Version, used, remaining, limit, applicable window start, and next reset using the transactional ledger snapshot.
    - _Requirements: 18.13, 18.14_
  - [-]* 9.11 Write the property test for internally consistent usage metadata
    - **Property 45: Usage metadata is internally consistent**
    - **Validates: Requirements 18.13, 18.14**
  - [-] 9.12 Enforce quota-accounting data minimization at persistence boundaries
    - Model and validate a fixed column allowlist that cannot store payloads, source, prompts, artifacts, Brand Config, paths, secrets, credentials, or Personal Data.
    - _Requirements: 18.17_
  - [-]* 9.13 Write the property test for minimized quota storage
    - **Property 46: Quota storage is a strict data-minimized projection**
    - **Validates: Requirements 18.17**
  - [-] 9.14 Implement prospective immutable Pricing Version publication
    - Require complete changed-plan values, counting rules, publication/effective timestamps, at least 30 calendar days lead time, and explicit transition behavior without mutating the initial version.
    - _Requirements: 18.19–18.21_
  - [-]* 9.15 Write the property test for immutable prospective pricing versions
    - **Property 47: Pricing versions are immutable and sufficiently prospective**
    - **Validates: Requirements 18.19, 18.20, 18.21**
  - [-] 9.16 Implement confirmed plan upgrades
    - Activate at the disclosed confirmed timestamp, retain current-window usage, and recalculate nonnegative remaining capacity from the higher limit.
    - _Requirements: 18.22_
  - [-]* 9.17 Write the property test for usage-preserving upgrades
    - **Property 48: Upgrades retain usage and apply the confirmed limit**
    - **Validates: Requirements 18.22**
  - [-] 9.18 Implement billing-boundary downgrades and cancellations
    - Schedule downgrades for next cycle, enforce lower limits against retained window usage, stop renewal on cancellation, preserve access through cycle end, then return inactive-subscription while public/self-host access remains available.
    - _Requirements: 18.23–18.26_
  - [-]* 9.19 Write the property test for downgrade and cancellation boundaries
    - **Property 49: Downgrades and cancellations honor billing-cycle boundaries**
    - **Validates: Requirements 18.23, 18.24, 18.25, 18.26**
  - [-]* 9.20 Add hosted gateway, database, and billing-adapter integration tests
    - Use a deterministic clock, transactional test database, fake payment adapter, duplicate webhooks, contention, worker errors, auth failures, excluded endpoints, and forbidden-field canaries.
    - Verify public Registry/API access remains independent of hosted state.
    - _Requirements: 18.1–18.26_

- [-] 10. Integrate and qualify the open-source MVP
  - [-] 10.1 Wire the immutable bundle through every MVP surface
    - Connect the 15–20 components, token engine, Registry, Public API, npm output, CLI, MCP, docs, self-host runtime, and optional hosted adapter to the same exact release snapshot.
    - Ensure no adapter creates a mutable catalog, hidden artifact, entitlement, or plan-specific MCP capability.
    - _Requirements: 1.1–1.12, 2.1–2.5, 7.1–7.10, 8.1–8.12, 14.1–14.12, 18.4, 18.5_
  - [-] 10.2 Implement the reproducible MVP release pipeline
    - Run pinned formatting, static analysis, unit/PBT, integration, accessibility, security, package, docs, compatibility, license/provenance, bundle-size, and runtime checks; require complete evidence and manual approval before stable promotion.
    - Publish the already-built exact version consistently to repository release assets, Registry, npm package output, and documentation output.
    - _Requirements: 2.4, 9.4, 10.1, 10.5, 11.7, 11.8, 12.1–12.14, 13.1, 13.7_
  - [-]* 10.3 Add end-to-end automated MVP conformance tests
    - Build one release fixture and compare every exact artifact through Registry, Public API, CLI, npm tarball, MCP transports, egress-blocked self-hosting, and hosted MCP.
    - Verify anonymous public access, checksum-before-use, source/license/package completeness, component accessibility, no private artifacts, and no artifact entitlements.
    - _Requirements: 1.1–1.12, 2.1–2.4, 7.2–7.11, 8.4, 8.9, 8.12, 9.10, 10.1–10.8, 11.9–11.11, 14.2, 14.3, 14.10, 18.18_

- [-] 11. MVP checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Add public motion capabilities after the MVP
  - [-] 12.1 Implement the Framer Motion package and closed customization schemas
    - Use an exact Compatible-License Framer Motion version and classify every required control exactly once as applicable or non-applicable with typed domains, defaults, constraints, and breakpoint support.
    - Keep all source, schemas, examples, and dependencies public and self-hostable.
    - _Requirements: 1.2, 1.9, 5.1–5.6, 5.22_
  - [-]* 12.2 Write the property test for closed motion-control classification
    - **Property 10: Motion control classification is closed and exclusive**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**
  - [-] 12.3 Implement motion default and override resolution
    - Apply every valid applicable override, fill omitted defaults, support declared breakpoint overrides, and never expose non-applicable controls.
    - _Requirements: 5.7, 5.8, 12.15_
  - [-]* 12.4 Write the property test for exact valid motion override resolution
    - **Property 11: Valid motion overrides resolve exactly**
    - **Validates: Requirements 5.7, 5.8, 12.15**
  - [-] 12.5 Implement exhaustive invalid motion configuration validation
    - Accumulate unknown-field, wrong-type, non-applicable, range, and invalid-combination faults with code, path, constraint, and guidance.
    - _Requirements: 5.9, 12.16_
  - [-]* 12.6 Write the property test for all invalid motion faults
    - **Property 12: Invalid motion configurations report all faults**
    - **Validates: Requirements 5.9, 12.16**
  - [-] 12.7 Implement accessible animated components and reduced-motion behavior
    - Preserve content, status, focus order, actions, keyboard and assistive behavior when motion is disabled or reduced; remove continuous decoration and limit essential transitions.
    - _Requirements: 5.10–5.12, 10.7, 10.8_
  - [-]* 12.8 Write the property test for semantic equivalence under motion reduction
    - **Property 13: Motion reduction preserves the semantic interaction model**
    - **Validates: Requirements 5.10, 5.11, 10.7**
  - [-] 12.9 Integrate motion Registry/MCP projections and evidence
    - Publish source, exact dependencies/provenance, schema version, applicability, defaults/ranges, validation constraints, reduced-motion contract, examples, performance records, and experimental blockers.
    - _Requirements: 5.13–5.15, 5.20–5.22_
  - [-]* 12.10 Add motion schema, interaction, accessibility, and performance tests
    - Generate valid/invalid configurations and test time, media preferences, viewport/gesture behavior, interactive examples, bundle budgets, runtime thresholds, and stable/experimental gating.
    - _Requirements: 5.7–5.15, 10.1–10.8, 12.15, 12.16_

- [-] 13. Add public 3D components with first-class fallbacks
  - [-] 13.1 Implement the 3D package, capability guard, and non-3D fallback contract
    - Add exact compatible dependencies/assets, parameter metadata, provenance, error boundaries, and functional fallbacks that preserve content, status, and primary actions.
    - _Requirements: 1.2, 1.9, 5.16, 5.17, 5.22, 10.7, 10.8_
  - [-] 13.2 Implement viewport suspension and resumable lifecycle state
    - Suspend continuous render/animation work offscreen and resume from a valid state while journaling committed user-visible action IDs to prevent replay.
    - _Requirements: 5.18, 5.19_
  - [-]* 13.3 Write the property test for safe 3D suspension and resumption
    - **Property 15: 3D suspension and resumption preserve valid state**
    - **Validates: Requirements 5.18, 5.19**
  - [-] 13.4 Integrate 3D Registry/MCP projections, examples, and quality evidence
    - Publish source, parameters, dependencies/assets/provenance, fallback, interactive example, performance record, and experimental blockers/warnings.
    - _Requirements: 5.14–5.17, 5.20–5.22_
  - [-]* 13.5 Write the property test for complete advanced artifact projections
    - **Property 14: Advanced Registry projections are complete**
    - **Validates: Requirements 5.13, 5.14, 5.16, 5.20, 5.21**
  - [-]* 13.6 Add 3D fallback, lifecycle, accessibility, and performance tests
    - Mock missing capability, initialization failure, intersection changes, render-loop counters, reduced motion, action IDs, budgets, and Registry classification.
    - _Requirements: 5.14–5.21, 10.1, 10.7, 10.8_

- [-] 14. Add deterministic curated compositions after advanced artifact contracts stabilize
  - [-] 14.1 Implement exact-version Composition Manifest schemas and resolver
    - Require source files, exact artifact refs, dependencies, compatibility, customization inputs, and typed semantic/responsive/accessibility/relationship invariants.
    - Keep templates, schemas, rules, examples, and source public; do not require a model provider.
    - _Requirements: 1.2, 1.9, 6.1, 6.8–6.10_
  - [-]* 14.2 Write the property test for complete resolvable Composition Manifests
    - **Property 16: Composition manifests resolve completely**
    - **Validates: Requirements 6.1, 6.10**
  - [-] 14.3 Implement Brand Config composition customization and invariant validation
    - Restrict edits to declared inputs and verify hierarchy, responsive behavior, accessibility behavior, and required relationships before returning output.
    - _Requirements: 6.7_
  - [-]* 14.4 Write the property test for invariant-preserving customization
    - **Property 17: Composition customization preserves invariants**
    - **Validates: Requirements 6.7**
  - [-] 14.5 Implement deterministic composition filtering, scoring, and explanations
    - Normalize intent/constraints, filter eligibility, apply published rule versions/weights/missing-evidence handling, tie-break by stable ID, and produce reproducible explanations.
    - _Requirements: 6.2, 6.3, 6.8_
  - [-]* 14.6 Write the property test for deterministic rule-conformant selection
    - **Property 18: Composition selection is deterministic and rule-conformant**
    - **Validates: Requirements 6.2, 6.3**
  - [-] 14.7 Implement composition retrieval, partial-result, and no-match responses
    - Return requested available elements with exact manifests/source/install/checksums, enumerate every unavailable element, and rank only public alternatives for every failed constraint.
    - _Requirements: 6.4–6.6_
  - [-]* 14.8 Write the property test for set-complete partial and no-match results
    - **Property 19: Composition partial and no-match results are set-complete**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  - [-] 14.9 Add versioned composition MCP operations and public documentation projections
    - Expose list/get/search/customize operations through the side-effect-free core with the same public/self-host availability and exact lineage as MVP operations.
    - If a generative adapter is later enabled, require public implementation/configuration, local/self-host paths, disclosed reproducibility limits, and manifest validation.
    - _Requirements: 6.2–6.9, 8.2, 8.10–8.12, 9.2, 9.4_
  - [-]* 14.10 Add composition integration, accessibility, and conformance tests
    - Exercise exact retrieval, customization, no-match/partial errors, invalid manifests, public docs, and public/self-host MCP parity with curated fixtures.
    - _Requirements: 6.1–6.10, 10.1, 10.7, 10.8, 14.10_

- [-] 15. Integrate and qualify later public capabilities
  - [-] 15.1 Wire motion, 3D, and compositions into immutable release snapshots
    - Add advanced kinds without changing MVP contracts, preserve entitlement-free/public/self-hosted access, and keep blocked capabilities experimental or deferred rather than weakening gates.
    - _Requirements: 1.2, 1.3, 1.9, 1.10, 2.5, 5.20, 5.21, 6.10, 13.5_
  - [-] 15.2 Extend release, documentation, migration, and conformance pipelines
    - Include advanced source/provenance, schemas, examples, performance/accessibility evidence, exact docs, migrations, Registry/API/MCP projections, and self-host parity in one release bundle.
    - _Requirements: 5.2, 5.13–5.22, 6.1–6.10, 9.2–9.9, 10.1–10.8, 12.1–12.16, 13.13, 14.3, 14.10_
  - [-]* 15.3 Add end-to-end advanced-capability release tests
    - Verify stable/experimental classification, checksum/provenance parity, reduced-motion and fallback semantics, deterministic composition behavior, anonymous access, and offline self-host operation.
    - _Requirements: 1.2, 1.9, 5.10–5.22, 6.1–6.10, 7.9, 8.9–8.12, 10.1–10.8, 14.2, 14.3_

- [-] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster implementation pass; core implementation tasks are never optional.
- Every correctness property from the design has exactly one dedicated fast-check task with at least 100 successful generated cases and the required `Feature: neuraforge-open-source-ui, Property N: ...` test comment.
- Each property task must create its own property-test file, and parallel implementation tasks must own separate modules/files; if the chosen scaffold combines those targets, serialize the affected tasks rather than editing one file concurrently.
- The open-source MVP is the critical path and ends at Task 11. Task 9 is an independent, non-gating hosted-capacity branch that starts only after the public MCP contract exists; Hosted MCP readiness is not a prerequisite for an MVP Stable Release.
- Motion, 3D, and curated compositions deliberately follow the MVP and remain public, open-source, entitlement-free capabilities.
- The optional Hosted MCP Service sells managed capacity only; it must never change available artifacts, operations, public access, self-host access, or Stable Release classification.
- Tasks create code, schemas, generated public pages, automated checks, and release/deployment assets. Values the design leaves configurable—browser versions, performance thresholds, governance deadlines, support windows, provider details, and administration limits—must come from versioned policy/config records rather than invented constants.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.6", "2.1", "3.1", "4.6", "7.4", "7.11", "9.1"] },
    { "id": 3, "tasks": ["1.4", "1.5", "1.7", "2.2", "3.2", "3.3", "3.4", "4.7", "7.5", "7.7", "7.9", "7.12", "7.13", "9.6", "9.12", "9.14"] },
    { "id": 4, "tasks": ["2.3", "2.4", "2.5", "2.6", "3.5", "3.7", "7.6", "7.8", "7.10", "9.7", "9.13", "9.15"] },
    { "id": 5, "tasks": ["3.6", "4.1", "4.2", "4.9", "4.13"] },
    { "id": 6, "tasks": ["4.3", "4.4", "4.8", "4.10", "4.11", "4.12", "4.14"] },
    { "id": 7, "tasks": ["4.5", "5.1", "6.1", "7.1"] },
    { "id": 8, "tasks": ["5.2", "5.3", "6.2", "6.3", "6.5", "7.2"] },
    { "id": 9, "tasks": ["5.4", "5.5", "6.4", "6.6", "7.3", "7.14"] },
    { "id": 10, "tasks": ["5.6", "5.7", "6.7", "6.9"] },
    { "id": 11, "tasks": ["6.8"] },
    { "id": 12, "tasks": ["8.1", "9.2"] },
    { "id": 13, "tasks": ["8.2", "8.3", "9.3", "9.4", "10.1"] },
    { "id": 14, "tasks": ["1.8", "4.15", "8.4", "9.5", "9.8", "9.10", "9.16", "9.18", "10.2"] },
    { "id": 15, "tasks": ["8.5", "9.9", "9.11", "9.17", "9.19", "10.3"] },
    { "id": 16, "tasks": ["9.20", "12.1"] },
    { "id": 17, "tasks": ["12.2", "12.3", "12.5", "12.7"] },
    { "id": 18, "tasks": ["12.4", "12.6", "12.8", "12.9"] },
    { "id": 19, "tasks": ["12.10", "13.1"] },
    { "id": 20, "tasks": ["13.2", "13.4"] },
    { "id": 21, "tasks": ["13.3", "13.5", "13.6"] },
    { "id": 22, "tasks": ["14.1"] },
    { "id": 23, "tasks": ["14.2", "14.3", "14.5", "14.7"] },
    { "id": 24, "tasks": ["14.4", "14.6", "14.8", "14.9"] },
    { "id": 25, "tasks": ["14.10", "15.1"] },
    { "id": 26, "tasks": ["15.2"] },
    { "id": 27, "tasks": ["15.3"] }
  ]
}
```
