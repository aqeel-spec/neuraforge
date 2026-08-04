# Requirements Document

## Introduction

NeuraForge UI is a public, open-source, AI-agent-native UI library. The project provides editable React and Tailwind CSS Components, Design Tokens, a public Registry and Public_API, npm and CLI distribution, open-source MCP_Server software, public documentation, and community contribution workflows. Later public releases may add Framer_Motion-based animation, 3D_Components, and curated Composition tools. Every Project_Artifact and MCP operation is available through public source and user-controlled self-hosting without artifact subscriptions, proprietary paid assets, paywalls, license keys, or private premium access. NeuraForge may separately charge transparent monthly fees for the optional Hosted_MCP_Service's managed operational capacity; those fees purchase hosting capacity and account administration only, not exclusive Project_Artifacts or MCP capabilities.

This document is the authoritative product requirements source for the `neuraforge-open-source-ui` feature. The existing design draft and the two NeuraForge planning documents are supporting inputs. Where a supporting input conflicts with this document, this document controls. The retained planning decisions are React-first delivery, Tailwind CSS styling, MCP-first discovery, a focused 15-through-20-Component MVP, incremental delivery of motion and 3D capabilities, and curated Composition templates before optional generative composition. Proposals for a General_Blog_Platform, paid or private Project_Artifacts, proprietary paid-only fonts, premium-only MCP operations, and entitlement-gated Self_Hosted_Deployment are outside this feature.

The delivery strategy is incremental. The MVP proves that AI_Agents can discover and retrieve a focused set of polished Components more reliably than generating equivalent UI from scratch. Motion_Presets, Animated_Components, 3D_Components, and Compositions are later public capabilities unless individual Project_Artifacts satisfy the applicable Quality_Gate in time for the MVP. Publishing is limited to project documentation and educational or release communications; a General_Blog_Platform is outside this feature.

## Glossary

- **NeuraForge_UI**: The complete open-source UI library project, including source code, packages, services, documentation, and community processes.
- **Project_Artifact**: Source code, component code, metadata, schemas, tokens, templates, examples, documentation, fonts, graphics, assets, or build tooling maintained by NeuraForge UI.
- **Original_Source**: The preferred human-editable source files and build instructions required to inspect, modify, build, and self-host a Project Artifact.
- **Public_Repository**: The publicly readable version-control repository containing Project Artifacts, issue history, governance records, audit records, and release history.
- **Open_Source_License**: The MIT License applied to original Project Artifacts unless a documented Compatible License is required for third-party material.
- **Compatible_License**: A license that permits public use, modification, redistribution, and self-hosting without payment or private-access obligations.
- **License_Provenance**: The exact dependency or asset name, version, source, copyright notice, license identifier, license text location, attribution, and redistribution obligations.
- **Release**: A versioned publication of one or more Project Artifacts.
- **Stable_Release**: A Release that has passed every required Quality Gate check without an active exception and has received manual approval.
- **Release_Manifest**: The machine-readable inventory of a Release, including exact Project Artifact versions, checksums, Original Source locations, License Provenance, notices, and build instructions.
- **MVP**: The first Stable Release containing 15 through 20 Components, core Design Tokens, the Registry, npm and CLI distribution, the MCP Server discovery operations, documentation, and contribution workflows.
- **Component**: A reusable React and Tailwind CSS user-interface implementation with documented metadata, dependencies, properties, states, behaviors, accessibility behavior, and examples.
- **Component_Category**: One of navigation, layout, forms, feedback, data display, or marketing.
- **Advanced_Capability**: A Motion Preset, 3D Component, Composition, theme, font, or related tool delivered after or alongside the MVP.
- **Framer_Motion**: The animation library dependency used by Motion_Presets and Animated_Components, with an exact Compatible-License version recorded for each Release.
- **Motion_Preset**: A reusable Framer_Motion-based animation behavior with declared applicable controls, typed configuration, timing, interaction, reduced-motion behavior, and performance characteristics.
- **Animated_Component**: A Component that uses Framer_Motion for one or more declared animation behaviors.
- **Motion_Customization_Schema**: The versioned, typed, machine-readable schema that declares the configuration fields, applicability, defaults, constraints, responsive behavior, and examples for a Motion_Preset or Animated_Component.
- **Motion_Control**: A configurable animation input for variants or keyframes; initial, animate, or exit state; duration; delay; repeat; easing; spring stiffness, damping, mass, or bounce; orchestration or stagger; gesture; viewport or scroll trigger; layout animation; motion disablement; or breakpoint-specific behavior.
- **Applicable_Control**: A Motion_Control supported by a specific Motion_Preset or Animated_Component, including the control's type, default, allowed values or numeric range, and validation constraints.
- **Non_Applicable_Control**: A Motion_Control intentionally unsupported by a specific Motion_Preset or Animated_Component and identified as unsupported in machine-readable metadata.
- **3D_Component**: A React user-interface element that presents interactive or animated three-dimensional content and supplies a non-3D fallback.
- **Performance_Record**: A reproducible measurement record containing the Project Artifact version, metric, test scenario, environment, result, threshold, and command.
- **Design_Token**: A named, machine-readable value for color, typography, spacing, sizing, elevation, border, breakpoint, or motion behavior.
- **Token_Schema**: The versioned machine-readable schema that is the single source of truth for Design Tokens and Brand Config data.
- **Brand_Config**: A documented set of Design Token values and font references used to generate a consistent visual theme.
- **Supported_Tailwind_Version**: A Tailwind CSS version or version range listed in a Release's compatibility metadata and covered by the Quality Gate.
- **Composition**: A curated, validated arrangement of versioned Components, Design Tokens, and optional Motion Presets or 3D Components that implements a section or page pattern.
- **Composition_Manifest**: The machine-readable inventory of exact Project Artifact versions, files, dependencies, compatibility constraints, customization inputs, and Branding Invariants for a Composition.
- **Branding_Invariant**: A documented content hierarchy, responsive behavior, accessibility behavior, or required semantic relationship preserved during Composition customization.
- **Selection_Rules**: Public deterministic filtering, scoring, tie-breaking, and no-match rules used to rank Components or Compositions.
- **Registry**: The public, versioned, machine-readable source of truth for Project Artifact metadata, compatibility, provenance, and distribution.
- **CLI**: The open-source command-line interface used to discover, inspect, and install Project Artifacts.
- **npm_Package**: A publicly available package distributed through the npm public registry.
- **MCP_Server**: The free, open-source Model Context Protocol software that enables AI coding agents to discover and retrieve Project Artifacts and that users may operate through a Self_Hosted_Deployment.
- **Hosted_MCP_Service**: The optional NeuraForge-operated deployment of the MCP_Server that charges only for managed operational capacity under a Hosted_Plan.
- **Hosted_Plan**: A monthly USD subscription defining a Hosted_MCP_Service daily MCP_Call quota and documented account or organization administration limits without changing available Project Artifacts or MCP operations.
- **Pricing_Version**: A published, immutable identifier for a set of Hosted_Plan prices, quotas, effective timestamps, and transition terms.
- **Initial_Pricing_Version**: The first Pricing_Version containing the Starter, Pro, and Team monthly prices and daily quotas defined by Requirement 18.
- **Billing_Cycle**: A monthly Hosted_MCP_Service service period with explicit UTC start and end timestamps shown before purchase and in billing metadata.
- **MCP_Call**: One authenticated Hosted_MCP_Service request that passes authentication and quota checks and reaches dispatch for a documented MCP operation; the request counts once whether the dispatched operation succeeds or returns a Structured_Operation_Error, and each separately submitted retry is a separate request.
- **Structured_Operation_Error**: A machine-readable error produced after dispatch of an MCP operation, including an error code, operation identifier, and applicable field or resource details.
- **Quota_Window**: The UTC day from 00:00:00 inclusive until the next 00:00:00 exclusive during which a Hosted_Plan MCP_Call quota applies.
- **Quota_Accounting_Data**: Hosted_MCP_Service operational data limited to account or organization identifier, Hosted_Plan, Pricing_Version, request identifier, operation identifier, request timestamp, counted or excluded classification, result classification, calls used, calls remaining, and Quota_Window reset timestamp; Quota_Accounting_Data excludes source code, prompts, Project_Artifact content, Brand_Config values, file paths, secrets, and credentials.
- **AI_Agent**: A software client that invokes MCP Server operations to assist with software development.
- **Public_API**: The publicly documented, machine-readable interface through which Registry data can be retrieved.
- **Public_Surface**: A released Component, Composition, Motion Preset, 3D Component, Design Token schema, CLI command, npm export, MCP Server operation, Public API operation, or self-hosting interface.
- **Maintainer**: A community member granted documented repository responsibilities through the Governance Model.
- **Maintainers**: The group of Maintainer members responsible for a project action.
- **Contributor**: A public community member who reports issues, proposes changes, reviews work, or submits Project Artifacts.
- **Contribution_Terms**: The public licensing and attribution conditions applied to accepted Contributor work.
- **Governance_Model**: The public rules for project decisions, Maintainer responsibilities, contribution review, conduct handling, disputes, and leadership succession.
- **Supported_Browser**: A browser and version listed in the compatibility matrix for a Release.
- **Accessibility_Baseline**: WCAG 2.2 Level AA plus documented keyboard, focus, semantic, assistive-technology, and reduced-motion behavior.
- **Quality_Gate**: The automated and manual checks required before a Project Artifact can enter a Stable Release.
- **Quality_Gate_Result**: A machine-readable per-check record containing status, scope, command, environment, evidence, and any exception reference.
- **Security_Report**: A vulnerability report submitted through the project's documented private initial-reporting channel.
- **Private_Security_Record**: A non-public record containing exception or vulnerability details whose publication before coordinated disclosure would increase risk.
- **Semantic_Version**: A version identifier following Semantic Versioning 2.0.0.
- **Supported_Release**: A Release within the exact support window stated by the supported-version policy.
- **Self_Hosted_Deployment**: A user-operated deployment of the Registry, Public API, documentation, or MCP Server that does not require a NeuraForge-operated service.
- **Telemetry**: Optional collection of aggregate operational or usage events from the CLI, documentation, Public API, or MCP Server.
- **Telemetry_Schema**: The public, versioned, machine-readable definition of every permitted Telemetry event, field, purpose, and retention period.
- **Personal_Data**: Information that identifies or can reasonably be linked to a person or device.
- **Public_Documentation_Site**: The freely accessible documentation and tutorial website for NeuraForge UI.
- **General_Blog_Platform**: A multi-author publishing product with feeds, memberships, comments, or monetized articles that is separate from NeuraForge UI.

## Requirements

### Requirement 1: Free and Open-Source Availability

**User Story:** As a public user, I want NeuraForge UI software, Project Artifacts, and self-hosting to remain free and open source, so that I can use, inspect, modify, redistribute, and operate the complete project independently of optional managed infrastructure.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL publish the complete Original_Source for every original Project_Artifact in the Public_Repository under the Open_Source_License.
2. WHEN the NeuraForge_UI publishes an Advanced_Capability, THE NeuraForge_UI SHALL provide the Advanced_Capability under the same artifact access and licensing conditions as MVP capabilities.
3. THE NeuraForge_UI SHALL provide every Release without payment, subscription, license key, purchased account, or private premium access.
4. WHERE a Release contains third-party material, THE Release_Manifest SHALL identify the License_Provenance for each dependency and asset.
5. IF a proposed dependency or asset has licensing terms that are not a Compatible_License, THEN THE NeuraForge_UI SHALL block the affected Release until the material is replaced or removed.
6. THE Release_Manifest SHALL reference the Open_Source_License text, copyright notices, third-party notices, and machine-readable license identifiers included with the Release.
7. WHEN a dependency or asset changes, THE Public_Repository SHALL retain an audit record containing the previous item, replacement item, versions, sources, License_Provenance, change rationale, reviewer, and approval date.
8. THE Release_Manifest SHALL identify the Original_Source and build instructions for every self-hostable Registry, Public_API, MCP_Server, and Public_Documentation_Site capability included in the Release.
9. THE NeuraForge_UI SHALL provide all Registry and Public_API access, MCP operations, Components, themes, Motion_Presets, Animated_Components, 3D_Components, and Compositions without artifact-specific payment or private entitlement.
10. THE NeuraForge_UI SHALL provide every Project_Artifact without a private, premium, or paid-only variant.
11. WHERE NeuraForge operates the optional Hosted_MCP_Service, THE Hosted_MCP_Service SHALL charge only for managed operational capacity under a published Hosted_Plan.
12. THE NeuraForge_UI SHALL permit unlimited user-controlled MCP operation volume in a Self_Hosted_Deployment without a NeuraForge-enforced quota, Hosted_Plan, or NeuraForge account.
### Requirement 2: Incremental MVP Delivery

**User Story:** As a project Maintainer, I want a constrained first release, so that the community can validate the agent-native workflow before the project expands.

#### Acceptance Criteria

1. THE MVP SHALL contain between 15 and 20 Components that satisfy every stable Component Quality Gate check.
2. THE MVP SHALL contain at least one Component from each Component_Category.
3. THE MVP SHALL include the Registry, CLI, npm_Package, MCP_Server discovery operations, Design Tokens, Public_Documentation_Site, and contribution workflow.
4. WHEN the MVP Quality_Gate succeeds and manual approval is recorded, THE NeuraForge_UI SHALL publish the same MVP version through the Public_Repository, Registry, and npm public registry.
5. IF an Advanced_Capability does not satisfy the Quality_Gate by the approved MVP release date, THEN THE NeuraForge_UI SHALL exclude the Advanced_Capability from the Stable_Release and retain the Advanced_Capability in its applicable public roadmap state.
6. WHEN the Maintainers prioritize candidate Components or subsequent Release work, THE Maintainers SHALL publish evidence for community impact, implementation effort, accessibility risk, security risk, and demand.
7. THE Governance_Model SHALL define numeric scoring direction, weights, missing-evidence treatment, and stable-identifier tie-breaking for Release prioritization.
8. WHEN identical prioritization inputs are evaluated, THE Maintainers SHALL produce the same ordered result using the published prioritization rules.

### Requirement 3: React and Tailwind Component System

**User Story:** As a React developer, I want polished Tailwind CSS Components with source ownership, so that I can integrate and adapt accessible UI without proprietary runtime dependencies.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL implement each Component as editable React source styled with Tailwind CSS.
2. THE Registry SHALL identify each Component's stable identifier, exact version, source files, generated files, dependencies, peer dependencies, compatible versions, installation instructions, and integrity checksum.
3. THE Registry SHALL enumerate each Component's properties with names, types, required status, defaults, and allowed values.
4. THE Registry SHALL enumerate each Component's supported states and keyboard, pointer, focus, disabled, loading, validation, and error behaviors, including explicit not-applicable entries.
5. THE Registry SHALL identify each Component's accessibility primitive, primitive version, and License_Provenance or record that the Component uses no external primitive.
6. THE Registry SHALL identify each Component's functional fallback and the browser capability that activates the fallback or record that no optional browser capability is required.
7. IF Component metadata omits a required metadata field or contains an unresolved version or license reference, THEN THE Quality_Gate SHALL reject the Component.
8. IF a Supported_Browser lacks an optional visual capability used by a Component, THEN THE Component SHALL activate the documented functional fallback while preserving content and primary actions.
### Requirement 4: Design Token and Theming System

**User Story:** As a product designer, I want open and machine-readable Design Tokens, so that human developers and AI_Agents can create visually consistent interfaces.

#### Acceptance Criteria

1. THE Token_Schema SHALL define Design Tokens for color, typography, spacing, sizing, elevation, borders, breakpoints, and motion.
2. THE NeuraForge_UI SHALL maintain one published Token_Schema version as the source of truth for each Design Token Release version.
3. WHEN a Brand_Config passes Token_Schema validation and requests theme generation for a Supported_Tailwind_Version, THE NeuraForge_UI SHALL generate a Tailwind-compatible theme that preserves the Brand_Config token values, types, references, and font references.
4. IF a Brand_Config fails Token_Schema validation, THEN THE NeuraForge_UI SHALL return every invalid field with a machine-readable error code, field path, constraint, and correction guidance.
5. WHEN valid Design Tokens are exported and then imported using the same Token_Schema version, THE NeuraForge_UI SHALL preserve equivalent names, values, types, references, and declared ordering semantics.
6. THE MCP_Server SHALL provide published Design Tokens, the exact Token_Schema version, and Supported_Tailwind_Versions without requiring a paid or private service.
7. WHERE a Project_Artifact distributes a font file, THE Release_Manifest SHALL identify the font file's License_Provenance.
8. WHEN a Brand_Config references a user-supplied font that is not distributed by NeuraForge_UI, THE NeuraForge_UI SHALL preserve the external font reference and exclude the font file from generated Project_Artifacts.
9. IF a requested Token_Schema, Design Token, or Supported_Tailwind_Version is unpublished, THEN THE NeuraForge_UI SHALL return a structured error containing the requested version and published alternatives.
10. THE Quality_Gate SHALL validate every generated theme against the requested Supported_Tailwind_Version.

### Requirement 5: Motion and 3D Capabilities

**User Story:** As an interface developer, I want configurable open motion and 3D building blocks with accessible fallbacks, so that I can create expressive interfaces without editing library internals, excluding users, or buying premium assets.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL base every Motion_Preset and Animated_Component animation behavior on Framer_Motion.
2. THE Release_Manifest SHALL record the exact Framer_Motion dependency version and License_Provenance confirming a Compatible_License for each Release containing a Motion_Preset or Animated_Component.
3. THE Motion_Customization_Schema SHALL classify every Motion_Control as an Applicable_Control or Non_Applicable_Control for each Motion_Preset and Animated_Component.
4. WHERE a Motion_Control is an Applicable_Control, THE Motion_Customization_Schema SHALL declare the Motion_Control name, type, default, allowed values or numeric range, constraints, and breakpoint applicability.
5. WHERE a Motion_Control is a Non_Applicable_Control, THE Motion_Customization_Schema SHALL identify the Motion_Control as non-applicable without exposing the Motion_Control as a supported customization input.
6. THE Motion_Customization_Schema SHALL classify variants or keyframes; initial, animate, and exit states; duration; delay; repeat; easing; spring stiffness, damping, mass, and bounce; orchestration and stagger; gestures; viewport and scroll triggers; layout animation; motion disablement; and breakpoint-specific behavior for every Motion_Preset and Animated_Component.
7. WHEN a consumer supplies valid overrides for Applicable_Controls, THE Motion_Preset or Animated_Component SHALL apply every supplied override without requiring modification of library internals.
8. WHERE breakpoint-specific behavior is applicable, THE Motion_Customization_Schema SHALL permit typed Applicable_Control overrides for each published breakpoint.
9. IF a Motion_Customization_Schema configuration contains an unknown field, wrong type, unsupported control, out-of-range value, or invalid control combination, THEN THE NeuraForge_UI SHALL reject the invalid configuration and return every detected error with a machine-readable code, field path, constraint, and correction guidance.
10. WHEN a consumer disables motion through the Motion_Customization_Schema, THE Motion_Preset or Animated_Component SHALL render the documented non-animated state while preserving content, status, focus order, and primary actions.
11. WHILE a user's reduced-motion preference is active, THE Motion_Preset or Animated_Component SHALL disable continuous decorative motion and limit essential state-transition motion to the documented reduced-motion behavior.
12. WHERE gesture, viewport, scroll, or layout behavior is applicable, THE Motion_Preset or Animated_Component SHALL preserve the documented keyboard, focus, assistive-technology, and reduced-motion behavior.
13. WHEN the Registry or MCP_Server returns a Motion_Preset or Animated_Component, THE Registry or MCP_Server SHALL return Original_Source, exact dependencies, the exact Motion_Customization_Schema version, applicability metadata, defaults, ranges, validation constraints, reduced-motion behavior, representative valid configuration examples, and an interactive example.
14. THE Registry SHALL publish at least one Performance_Record for each released Motion_Preset, Animated_Component, and 3D_Component.
15. IF a Motion_Preset, Animated_Component, or 3D_Component exceeds a published runtime-performance or bundle-size threshold, THEN THE Quality_Gate SHALL reject the Project_Artifact from a Stable_Release.
16. WHEN the NeuraForge_UI publishes a 3D_Component, THE Registry SHALL provide Original_Source, exact dependencies, parameter metadata, asset License_Provenance, fallback behavior, and an interactive example.
17. IF a 3D rendering capability is unavailable or initialization fails, THEN THE 3D_Component SHALL present the documented non-3D fallback while preserving content, status, and primary actions.
18. WHILE a 3D_Component is outside the viewport, THE 3D_Component SHALL suspend continuous rendering and animation work.
19. WHEN a suspended 3D_Component re-enters the viewport, THE 3D_Component SHALL resume from a documented valid state without duplicating user-visible actions.
20. IF a Motion_Preset, Animated_Component, or 3D_Component has an accessibility failure, performance failure, active Quality Gate exception, invalid Motion_Customization_Schema, or incomplete required evidence, THEN THE Registry SHALL classify the Project_Artifact as experimental and identify each blocking condition.
21. WHEN the Registry publishes an experimental Motion_Preset, Animated_Component, or 3D_Component, THE Registry SHALL expose the experimental status, known limitations, failed checks, and adoption warning in machine-readable metadata and documentation.
22. THE Release_Manifest SHALL provide License_Provenance for every Motion_Preset, Animated_Component, 3D_Component, example, dependency, and required asset.

### Requirement 6: Curated Composition Tools

**User Story:** As an AI_Agent user, I want validated section and page Compositions, so that an agent can assemble coherent interfaces from known Project Artifacts.

#### Acceptance Criteria

1. THE Registry SHALL publish each Composition with Original_Source and a Composition_Manifest containing exact versions, source files, dependencies, compatibility constraints, customization inputs, and Branding_Invariants.
2. WHEN an AI_Agent requests Compositions by intent and constraints, THE MCP_Server SHALL filter, score, tie-break, and rank matching Compositions using the published Selection_Rules.
3. WHEN identical Composition request inputs and Registry versions are evaluated, THE MCP_Server SHALL return the same ordered stable identifiers and match explanations.
4. WHEN an AI_Agent selects a published Composition version, THE MCP_Server SHALL return the Composition_Manifest, requested available source elements, installation instructions, customization inputs, and integrity checksums.
5. IF one or more requested Composition elements are unavailable, THEN THE MCP_Server SHALL return a structured partial-result error that identifies every unavailable element and excludes no available requested element.
6. IF no Composition satisfies all request constraints, THEN THE MCP_Server SHALL return a structured no-match result containing the failed constraints and ranked public alternatives selected by the published Selection_Rules.
7. WHEN a Composition is customized with a valid Brand_Config, THE MCP_Server SHALL preserve every Branding_Invariant declared in the Composition_Manifest.
8. THE NeuraForge_UI SHALL publish Composition Selection_Rules, templates, validation schemas, and representative validation examples in the Public_Repository.
9. WHERE generative composition is offered, THE NeuraForge_UI SHALL publish the generative implementation, exact model or provider configuration interface, local or self-hosted configuration path, and reproducibility limitations under the Open_Source_License.
10. IF a Composition_Manifest contains an unresolved Project Artifact version, incompatible constraint, missing Branding Invariant, or invalid schema field, THEN THE Quality_Gate SHALL reject the Composition.

### Requirement 7: Public Registry and Distribution

**User Story:** As a developer, I want consistent public distribution channels, so that I can inspect and install the same versioned Project Artifacts through human and agent workflows.

#### Acceptance Criteria

1. THE Registry SHALL expose public metadata and Original_Source only for exact published Project Artifact versions.
2. THE Public_API SHALL permit unauthenticated retrieval of public Registry metadata and released Project Artifacts.
3. WHEN a Release contains npm-distributed Project Artifacts, THE npm_Package SHALL publish the exact Semantic_Version and corresponding React Components and Design Tokens through the npm public registry.
4. THE CLI SHALL provide commands to search, inspect, preview installation, install, and roll back released Project Artifacts from the Registry.
5. WHEN the CLI previews an installation, THE CLI SHALL report the exact selected versions, source Registry location, integrity checksums, dependency changes, file additions, file modifications, file conflicts, and rollback plan without changing project files.
6. WHEN the CLI proceeds after preview, THE CLI SHALL require explicit confirmation of the displayed plan before changing project files.
7. IF an installation target conflicts with an existing file and overwrite approval is absent, THEN THE CLI SHALL preserve the existing file and return a conflict report.
8. IF a confirmed installation fails after changing project files, THEN THE CLI SHALL execute the displayed rollback plan and report the rollback result.
9. WHEN the same Project Artifact version is retrieved through the Registry, Public_API, CLI, npm_Package, or MCP_Server, THE NeuraForge_UI SHALL provide matching canonical source checksums, exact dependency versions, compatibility metadata, and License_Provenance.
10. THE Registry SHALL publish a deterministic checksum, checksum algorithm identifier, and canonical byte-generation rule for every downloadable Project_Artifact.
11. THE CLI SHALL verify each downloaded Project_Artifact against the Registry checksum before applying an installation plan.
### Requirement 8: AI-Agent-Native MCP Server

**User Story:** As an AI_Agent user, I want free open-source MCP_Server software that returns trustworthy library artifacts, so that an agent can discover and integrate NeuraForge UI without inventing unsupported code or depending on managed hosting.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose documented operations to list Components, retrieve a Component, search Components, and retrieve Design Tokens in the MVP.
2. THE MCP_Server SHALL publish an input schema, output schema, validation rules, error codes, pagination fields, and examples for every public operation.
3. WHEN an AI_Agent lists Components with filters and pagination inputs, THE MCP_Server SHALL return only matching Components plus a deterministic next-page cursor when more matching Components remain.
4. WHEN an AI_Agent retrieves a released Component by stable identifier and exact version, THE MCP_Server SHALL return Original_Source, metadata, exact dependencies, installation instructions, checksum, Registry version, and License_Provenance.
5. WHEN an AI_Agent submits a valid search query, THE MCP_Server SHALL return matches ranked by the published Selection_Rules with stable identifiers, exact versions, scores, and match explanations.
6. WHEN identical search inputs and Registry versions are evaluated, THE MCP_Server SHALL return the same result order and pagination boundaries.
7. IF an AI_Agent requests an unknown Component or version, THEN THE MCP_Server SHALL return a structured not-found response containing the request and published alternatives.
8. IF an AI_Agent provides invalid operation input, THEN THE MCP_Server SHALL return field-specific validation errors without invoking the requested Registry retrieval.
9. IF the Registry is unavailable or integrity validation cannot complete, THEN THE MCP_Server SHALL return a structured availability or integrity error without presenting an unverified Project_Artifact.
10. WHEN the MCP_Server returns generated or customized source, THE MCP_Server SHALL identify every source Project Artifact by stable identifier, exact version, checksum, and Registry location.
11. THE MCP_Server SHALL complete every operation without creating, modifying, or deleting files in an AI_Agent caller's project.
12. THE MCP_Server SHALL operate from the public Registry without requiring a subscription, payment credential, private Registry endpoint, or Hosted_MCP_Service account.

### Requirement 9: Public Documentation and Tutorials

**User Story:** As a community member, I want complete public documentation and tutorials, so that I can learn, evaluate, use, and contribute to every project capability.

#### Acceptance Criteria

1. THE Public_Documentation_Site SHALL document installation, exact version compatibility, theming, accessibility, security, self-hosting, contribution, governance, and release policies.
2. THE Public_Documentation_Site SHALL provide a versioned page containing examples, API details, metadata, compatibility, and source links for every Public_Surface.
3. THE Public_Documentation_Site SHALL provide search across titles, stable identifiers, categories, versions, API terms, and page content for every published documentation version.
4. WHEN a Release adds or changes a Public_Surface, THE NeuraForge_UI SHALL publish the corresponding documentation in the same Release.
5. WHEN documentation shows an installation, migration, or integration command, THE Public_Documentation_Site SHALL identify every compatible Project Artifact version and required tool version.
6. IF a required documentation accessibility check fails, THEN THE Quality_Gate SHALL reject the affected documentation Release as stable.
7. THE Public_Documentation_Site SHALL provide public tutorials for installation, Component use, theming, MCP Server use, and self-hosting without authentication or payment.
8. WHEN a Release introduces a breaking change or deprecation, THE Public_Documentation_Site SHALL publish a versioned migration guide containing affected interfaces, before-and-after examples, and required migration actions.
9. THE Public_Documentation_Site SHALL identify the Open_Source_License and source location for reusable tutorial code and examples.
10. THE Public_Documentation_Site SHALL make every documentation page publicly readable without authentication or payment.

### Requirement 10: Accessibility

**User Story:** As a person using assistive technology or alternative input, I want accessible Components and examples, so that I can perceive, operate, and understand interfaces built with NeuraForge UI.

#### Acceptance Criteria

1. THE Quality_Gate SHALL require every stable Component, Composition, example, Motion_Preset, Animated_Component, and 3D_Component to satisfy the Accessibility_Baseline.
2. WHEN a user operates an interactive Project_Artifact by keyboard, THE Project_Artifact SHALL expose every pointer-accessible primary action through keyboard input alone.
3. WHILE focus is within an interactive Project_Artifact, THE Project_Artifact SHALL present a visible focus indicator that satisfies the Accessibility_Baseline.
4. WHEN a Project_Artifact communicates content, validation, status, or error information visually, THE Project_Artifact SHALL expose equivalent programmatic information to assistive technology.
5. IF any required automated or manual accessibility check fails, THEN THE Quality_Gate SHALL reject the affected Project_Artifact from a Stable_Release.
6. WHEN a Project_Artifact receives a manual accessibility review, THE Public_Documentation_Site SHALL publish the review scope, tested version, assistive technology or input method, result, and unresolved findings.
7. WHERE a Project_Artifact includes animation or 3D content, THE Project_Artifact SHALL provide reduced-motion behavior that preserves the same content, status, and primary actions.
8. WHERE a Project_Artifact includes pointer interaction, THE Project_Artifact SHALL provide keyboard and assistive-technology behavior that preserves the same content, status, and primary actions.
9. IF an accessibility regression is discovered in a Stable_Release, THEN THE NeuraForge_UI SHALL record the affected versions, user impact, remediation status, and available workaround in the Public_Repository.

### Requirement 11: Security and Supply-Chain Integrity

**User Story:** As a project adopter, I want secure source, packages, and services, so that I can assess and manage risks before integrating NeuraForge UI.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL publish a security policy containing exact Supported Release ranges, report acknowledgement deadline, triage deadline, reporter update interval, disclosure process, and severity definitions.
2. THE NeuraForge_UI SHALL provide a private initial-reporting channel for a Security_Report.
3. THE NeuraForge_UI SHALL publish a threat model identifying protected assets, trust boundaries, threat actors, abuse cases, mitigations, and residual risks for the Registry, Public_API, CLI, npm_Package, MCP_Server, Hosted_MCP_Service, and Self_Hosted_Deployment.
4. WHEN Maintainers receive a Security_Report, THE Maintainers SHALL acknowledge, triage, update, and coordinate disclosure within the timelines defined by the security policy.
5. WHEN a Security_Report enters public disclosure, THE Maintainers SHALL publish an advisory containing affected versions, severity, impact, workarounds, remediation status, and disclosure timeline.
6. WHEN a remediation Release becomes available, THE Maintainers SHALL update the advisory with exact fixed versions, checksums, and migration actions.
7. IF a required dependency, source, secret, license, or vulnerability scan reports a release-blocking result under the security policy, THEN THE Quality_Gate SHALL reject the affected Release.
8. IF a required security scan is unavailable, incomplete, or malformed, THEN THE Quality_Gate SHALL reject the affected Release.
9. THE CLI and MCP_Server SHALL validate downloaded Registry content against the published checksum before presenting the Project_Artifact as verified.
10. IF checksum validation fails or cannot complete, THEN THE CLI or MCP_Server SHALL reject the Project_Artifact and return an integrity error containing the expected checksum, observed result when available, and source location.
11. THE Release_Manifest SHALL contain a machine-readable inventory of exact direct and transitive production dependency versions, sources, checksums, and License_Provenance.
12. IF a Security_Report affects an unsupported Release, THEN THE Maintainers SHALL publish an advisory that identifies the nearest Supported_Release remediation target.
### Requirement 12: Quality and Compatibility

**User Story:** As a developer, I want measurable release quality, so that I can adopt Project Artifacts with known behavior and compatibility.

#### Acceptance Criteria

1. THE Quality_Gate SHALL run formatting, static analysis, unit, integration, accessibility, security, package, documentation, and compatibility checks for each proposed Release.
2. THE Quality_Gate SHALL publish a Quality_Gate_Result for every required non-confidential check in each proposed Release.
3. THE Quality_Gate SHALL require every stable Component to have automated coverage for each documented state, transition, keyboard interaction, pointer interaction, validation behavior, error behavior, and fallback behavior that applies to the Component.
4. THE Quality_Gate SHALL use generated valid Token_Schema instances to verify Design Token export-and-import round-trip preservation.
5. THE Quality_Gate SHALL use generated invalid Token_Schema instances to verify field-specific validation errors.
6. THE Registry SHALL define measurable bundle-size and runtime-performance budgets for every stable runtime Project_Artifact, including metric, test scenario, environment, threshold, and command.
7. IF a stable runtime Project_Artifact exceeds a published size or performance threshold, THEN THE Quality_Gate SHALL reject the affected Project_Artifact.
8. THE NeuraForge_UI SHALL publish a compatibility matrix containing each Supported_Browser version, operating environment, tested Public Surface, test result, and test date for every Stable_Release.
9. IF any required Quality_Gate check fails or lacks a valid result, THEN THE NeuraForge_UI SHALL prevent the proposed Release from being marked stable.
10. WHEN every required Quality_Gate check succeeds, THE Maintainers SHALL record manual approval before marking the proposed Release stable.
11. WHERE Maintainers grant a time-limited exception to a non-security Quality Gate check, THE Public_Repository SHALL record the failed check, evidence, rationale, scope, owner, approval, expiration date, and expiration Release.
12. WHERE disclosure of a Quality Gate exception would increase an unresolved security risk, THE Private_Security_Record SHALL contain the failed check, evidence, rationale, scope, owner, approval, and expiration.
13. WHERE a proposed Release contains an active Quality Gate exception, THE NeuraForge_UI SHALL classify the proposed Release as experimental rather than stable.
14. THE NeuraForge_UI SHALL publish pinned tool versions, environment prerequisites, fixtures, and commands required to reproduce every non-confidential Quality Gate check.
15. THE Quality_Gate SHALL use generated valid Motion_Customization_Schema configurations to verify declared defaults, Applicable_Control overrides, breakpoint-specific behavior, and motion disablement.
16. THE Quality_Gate SHALL use generated invalid Motion_Customization_Schema configurations to verify field-specific errors for unknown fields, wrong types, Non_Applicable_Controls, out-of-range values, and invalid control combinations.

### Requirement 13: Versioning and Release Management

**User Story:** As a library consumer, I want predictable versions and migrations, so that I can upgrade NeuraForge UI with understood compatibility impact.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL assign a unique Semantic_Version to every Release.
2. WHEN a Release removes or incompatibly changes a stable Public_Surface, THE NeuraForge_UI SHALL increment the major version and reset the minor and patch versions to zero.
3. WHEN a Release adds backward-compatible functionality without a breaking change, THE NeuraForge_UI SHALL increment the minor version and reset the patch version to zero.
4. WHEN a Release contains only backward-compatible fixes, THE NeuraForge_UI SHALL increment the patch version.
5. WHERE a Release is experimental, THE NeuraForge_UI SHALL assign a Semantic_Version pre-release identifier that places the Release outside the Stable_Release support window.
6. THE NeuraForge_UI SHALL publish a supported-version policy containing exact Supported Release ranges, support start conditions, support end conditions, and security-fix eligibility.
7. THE NeuraForge_UI SHALL publish a changelog containing additions, changes, fixes, advisories, deprecations, and migration actions for every Release.
8. WHEN a stable Public_Surface is deprecated, THE NeuraForge_UI SHALL publish the replacement, deprecation version, earliest removal version, and migration instructions.
9. THE Registry SHALL preserve the Release_Manifest, Original_Source, metadata, checksums, and documentation for every Supported_Release.
10. WHILE a Release is a Supported_Release, THE Registry SHALL preserve the published Project Artifact bytes, checksums, versions, and compatibility metadata without mutation.
11. IF correction of a Supported_Release requires changed artifact bytes or metadata, THEN THE NeuraForge_UI SHALL publish the correction under a new Semantic_Version.
12. IF a requested Release is unsupported, THEN THE Registry SHALL return the support status, last supported version in the requested line, nearest Supported Release target, and applicable migration guide.
13. WHEN a Release changes a Token_Schema, Composition_Manifest schema, Registry schema, or public operation incompatibly, THE NeuraForge_UI SHALL publish a machine-readable migration and a human-readable migration guide.

### Requirement 14: Self-Hosting and Operational Independence

**User Story:** As an organization or individual, I want to self-host NeuraForge UI services, so that I can operate independently while retaining every public capability.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL publish Original_Source and deployment documentation for a Self_Hosted_Deployment of the Registry, Public_API, MCP_Server, and Public_Documentation_Site.
2. THE Self_Hosted_Deployment SHALL start, operate, and serve local Project Artifacts without contacting a NeuraForge-operated service.
3. THE Self_Hosted_Deployment SHALL provide the same documented Registry retrieval, Public API, documentation, and MCP Server operations as the corresponding exact public Release version.
4. THE Self_Hosted_Deployment SHALL support user-controlled network endpoints, storage, credentials, and retention configuration.
5. WHEN a Self_Hosted_Deployment receives a valid complete configuration, THE Self_Hosted_Deployment SHALL validate the configuration before starting enabled interfaces.
6. IF a Self_Hosted_Deployment configuration is invalid, THEN THE Self_Hosted_Deployment SHALL reject startup and return every detected invalid field with a field path, error code, constraint, and correction guidance.
7. WHILE a Self_Hosted_Deployment is running, THE Self_Hosted_Deployment SHALL expose health information containing service version, Registry version, configuration-schema version, enabled interfaces, and per-interface status.
8. THE NeuraForge_UI SHALL publish versioned backup, restore, upgrade, rollback, and integrity-verification procedures for Self_Hosted_Deployment configuration and data.
9. WHEN a documented restore or rollback procedure completes, THE Self_Hosted_Deployment SHALL verify Registry checksums and report every integrity mismatch.
10. THE Quality_Gate SHALL verify operation parity between each Self_Hosted_Deployment Release and the corresponding public Release using the same conformance cases.
11. THE Self_Hosted_Deployment SHALL provide every released capability under the Open_Source_License without a license key, Hosted_Plan, or NeuraForge account.
12. THE Self_Hosted_Deployment SHALL place MCP operation volume and resource limits under user control without a NeuraForge-enforced MCP_Call quota.
### Requirement 15: Privacy-Conscious Telemetry

**User Story:** As a privacy-conscious user, I want transparent and optional Telemetry, so that I can control whether usage information leaves my environment.

#### Acceptance Criteria

1. THE CLI, MCP_Server, Public_Documentation_Site, and Self_Hosted_Deployment SHALL disable Telemetry by default.
2. WHEN a user chooses to enable Telemetry, THE NeuraForge_UI SHALL present the Telemetry_Schema version, event fields, collection purposes, retention period, recipient, disable procedure, and deletion procedure before requesting explicit consent.
3. WHEN a user grants Telemetry consent, THE NeuraForge_UI SHALL record the consented Telemetry_Schema version and provide a consent receipt.
4. WHILE Telemetry collection is active, THE NeuraForge_UI SHALL collect only events and fields permitted by the consented Telemetry_Schema version.
5. THE Telemetry_Schema SHALL exclude source code, prompts, Brand_Config values, file paths, secrets, credentials, and Personal_Data.
6. THE Telemetry_Schema SHALL assign each retained event a retention period from 0 through 30 calendar days.
7. WHEN the permitted events, fields, purposes, recipients, or retention periods change, THE NeuraForge_UI SHALL disable collection under the changed Telemetry_Schema version until the user grants new consent.
8. WHEN a user disables Telemetry, THE CLI, MCP_Server, Public_Documentation_Site, or Self_Hosted_Deployment SHALL stop transmitting subsequent Telemetry events before acknowledging the disable action.
9. WHEN a user requests deletion using a valid consent receipt, THE NeuraForge_UI SHALL delete retained Telemetry associated with the consent receipt and report completion or any legally required retention.
10. THE NeuraForge_UI SHALL publish Telemetry consent, validation, collection, aggregation, retention, disablement, and deletion logic in the Public_Repository.
11. IF a Telemetry event fails Telemetry_Schema validation, THEN THE NeuraForge_UI SHALL discard the Telemetry event before storage or transmission.

### Requirement 16: Public Governance and Community Participation

**User Story:** As a Contributor, I want transparent and inclusive project governance, so that I can participate in decisions and earn responsibility through documented processes.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL publish the Governance_Model, contribution guide, code of conduct, Maintainer list, Contribution_Terms, decision process, and correction process in the Public_Repository.
2. THE Governance_Model SHALL define proposal submission fields, completeness rules, review criteria, review windows measured in calendar days, decision deadlines measured in calendar days, decision authority, voting or consensus rules, conflict resolution, Maintainer selection, Maintainer removal, and leadership succession.
3. WHEN a Contributor submits a complete proposal or change, THE Maintainers SHALL publish the review start, review deadline, decision deadline, status, reviewers, and final decision record in the Public_Repository.
4. IF a submission is incomplete, THEN THE Maintainers SHALL identify every missing required field and provide the documented correction and resubmission path.
5. WHEN Maintainers make a roadmap or governance decision, THE Maintainers SHALL publish the outcome, rationale, participating decision-makers, disclosed conflicts, evidence considered, and decision date in the Public_Repository.
6. IF a decision misses a published deadline, THEN THE Maintainers SHALL publish the delay reason and a replacement deadline in the Public_Repository.
7. IF a Contributor reports conduct that threatens community safety, THEN THE Maintainers SHALL follow the published confidential reporting, access-control, conflict-of-interest, recusal, retention, appeal, and enforcement process.
8. THE Contribution_Terms SHALL preserve the Open_Source_License for accepted original contributions and document contributor attribution, third-party provenance, and contributor authority to license the submission.
9. WHEN a Contributor meets the published Maintainer eligibility criteria, THE Governance_Model SHALL provide a public nomination, conflict disclosure, review, decision, and appeal path.
10. THE NeuraForge_UI SHALL publish a roadmap that assigns each item exactly one state from planned, active, experimental, stable, or deferred and records the most recent state-change date.
11. IF a published governance or roadmap record contains a factual or procedural error, THEN THE Maintainers SHALL preserve the original record and publish a linked correction containing the reason, author, and correction date.
12. THE NeuraForge_UI SHALL provide public issue, discussion, proposal, and change-review workflows without payment.

### Requirement 17: Feature Boundary

**User Story:** As a project participant, I want a clear product boundary, so that NeuraForge UI remains focused on the open-source UI library.

#### Acceptance Criteria

1. THE NeuraForge_UI SHALL limit publishing functionality in this feature to documentation, tutorials, examples, changelogs, migration guides, and project announcements about NeuraForge UI.
2. IF a requested publishing capability is not documentation, a tutorial, an example, a changelog, a migration guide, or a project announcement about NeuraForge UI, THEN THE Maintainers SHALL classify the capability outside this feature boundary.
3. IF a requested capability belongs to the General_Blog_Platform, THEN THE Maintainers SHALL record the capability outside the NeuraForge UI roadmap.
4. THE Public_Documentation_Site SHALL make all in-scope NeuraForge UI educational and release content publicly readable without payment or authentication.
5. WHERE a tutorial references a Project_Artifact, THE Public_Documentation_Site SHALL resolve the reference to an exact published version, public Original_Source link, and matching versioned documentation link.
6. IF any tutorial Project Artifact reference lacks an exact published version, public Original Source link, or matching versioned documentation link, THEN THE Quality_Gate SHALL block publication of the affected tutorial.

### Requirement 18: Optional Hosted MCP Service Pricing and Quotas

**User Story:** As an MCP user, I want transparent optional managed hosting with predictable monthly quotas, so that I can choose managed operational capacity without losing access to open-source software, public artifacts, or self-hosting.

#### Acceptance Criteria

1. WHERE a user chooses the Hosted_MCP_Service, THE Hosted_MCP_Service SHALL require authenticated access to hosted MCP operations.
2. THE Initial_Pricing_Version SHALL define Starter at USD $9 per month with a quota of 500 MCP_Call requests per Quota_Window, Pro at USD $29 per month with a quota of 3,000 MCP_Call requests per Quota_Window, and Team at USD $79 per month with a quota of 10,000 MCP_Call requests per Quota_Window.
3. THE Hosted_MCP_Service SHALL limit Hosted_Plan billing intervals to monthly Billing_Cycles.
4. THE Hosted_MCP_Service SHALL provide the same released Project_Artifacts and documented MCP operations to Starter, Pro, and Team accounts.
5. THE Hosted_MCP_Service SHALL limit plan-based MCP differences to daily MCP_Call capacity and documented account or organization administration for members, roles, and billing contacts.
6. THE Hosted_MCP_Service SHALL calculate Hosted_Plan charges from the published monthly price without per-call overage charges.
7. WHEN an authenticated hosted request passes quota validation and reaches MCP operation dispatch, THE Hosted_MCP_Service SHALL increment Quota_Accounting_Data exactly once whether the operation succeeds or returns a Structured_Operation_Error.
8. WHEN an authenticated hosted request returns a Structured_Operation_Error after MCP operation dispatch, THE Hosted_MCP_Service SHALL classify the request as one counted MCP_Call.
9. WHEN a request is rejected by authentication or pre-dispatch quota validation, THE Hosted_MCP_Service SHALL exclude the request from MCP_Call usage.
10. WHEN a request invokes a documented health, service-status, billing, or quota-inspection endpoint, THE Hosted_MCP_Service SHALL exclude the request from MCP_Call usage.
11. WHEN a client separately submits a retry that passes authentication and quota validation and reaches MCP operation dispatch, THE Hosted_MCP_Service SHALL count the retry as a new MCP_Call.
12. THE Hosted_MCP_Service SHALL apply each daily quota over a Quota_Window that resets calls used to zero at 00:00:00 UTC.
13. WHEN the Hosted_MCP_Service returns an authenticated hosted MCP response, THE Hosted_MCP_Service SHALL expose the Hosted_Plan, Pricing_Version, calls used, calls remaining, daily call limit, and next 00:00:00 UTC reset timestamp in machine-readable metadata.
14. WHEN an authenticated account requests quota inspection, THE Hosted_MCP_Service SHALL return the Hosted_Plan, Pricing_Version, calls used, calls remaining, daily call limit, current Quota_Window start, and next reset timestamp.
15. IF an account has used the Hosted_Plan daily MCP_Call limit, THEN THE Hosted_MCP_Service SHALL return a structured `quota_exceeded` error containing the Hosted_Plan, daily call limit, calls used, zero calls remaining, and next reset timestamp without dispatching or executing the requested MCP operation.
16. WHILE an account has exhausted the Hosted_Plan daily MCP_Call limit, THE Hosted_MCP_Service SHALL preserve the account's monthly charge without adding an overage fee.
17. THE Hosted_MCP_Service SHALL use only Quota_Accounting_Data for quota counting and usage metadata.
18. THE Hosted_MCP_Service SHALL preserve unauthenticated public Registry and Public_API retrieval independently of Hosted_Plan status, quota usage, or Hosted_MCP_Service authentication.
19. WHEN NeuraForge changes a Hosted_Plan price, quota, quota-counting rule, or transition term after the Initial_Pricing_Version, THE NeuraForge_UI SHALL publish a new Pricing_Version at least 30 calendar days before the effective timestamp.
20. THE NeuraForge_UI SHALL preserve the Initial_Pricing_Version prices and quotas as the immutable values for the Initial_Pricing_Version.
21. WHEN the NeuraForge_UI publishes a new Pricing_Version, THE NeuraForge_UI SHALL publish each affected Hosted_Plan, monthly USD price, daily MCP_Call quota, quota-counting rules, publication timestamp, effective timestamp, and account transition behavior.
22. WHEN an account confirms a Hosted_Plan upgrade after receiving the exact charge and effective timestamp, THE Hosted_MCP_Service SHALL activate the higher daily quota at the confirmed effective timestamp, retain calls used in the current Quota_Window, and calculate calls remaining as the higher daily limit minus current calls used.
23. WHEN an account requests a Hosted_Plan downgrade, THE Hosted_MCP_Service SHALL schedule the lower plan for the next Billing_Cycle, preserve the current plan through the current Billing_Cycle end timestamp, and disclose the scheduled plan and effective timestamp.
24. IF calls used in the active Quota_Window equal or exceed a downgraded plan's daily limit when the downgrade becomes effective, THEN THE Hosted_MCP_Service SHALL return the structured `quota_exceeded` error for subsequent counted operations until the next Quota_Window begins.
25. WHEN an account cancels a Hosted_Plan, THE Hosted_MCP_Service SHALL disable renewal, preserve hosted access through the current Billing_Cycle end timestamp, and disclose the access end timestamp.
26. WHEN a canceled Hosted_Plan reaches the Billing_Cycle end timestamp, THE Hosted_MCP_Service SHALL reject subsequent hosted MCP operation requests with a structured inactive-subscription error while preserving public Registry, Public_API, and Self_Hosted_Deployment access.