# Contributing to NeuraForge UI

Thanks for considering a contribution. This project is open-source first: everything the hosted
service serves is in this repository, under MIT, and self-hostable.

## Contribution terms

By opening a pull request you agree that your contribution is licensed under the
[MIT License](./LICENSE) and that you have the right to license it. Contributions are attributed
in the release notes for the version that first includes them.

We cannot accept code copied from an incompatible license. If your change adapts third-party
work, say so in the pull request and name the upstream project and its license so provenance can
be recorded.

## Before you start

Open an issue first for anything larger than a bug fix. Two things the project deliberately
constrains:

- **Component count.** The MVP holds 15–20 _stable_ components on purpose. A new component
  usually means promoting it through `experimental` first, and may mean demoting another.
  Prioritization uses published, weighted evidence — see `packages/release-policy`.
- **Public contracts.** Schemas, MCP operation signatures, and Registry responses are versioned.
  An incompatible change requires a new version plus a migration, never an edit to a published
  one.

## Setup

```bash
cd plan
npm install
npm run check
```

`npm run check` runs the full gate: schema generation check, format check, lint, typecheck, unit
tests, and integration tests. It must pass before a pull request can merge.

Useful targets:

| Command                    | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `npm run test:unit`        | Unit tests                                   |
| `npm run test:integration` | Integration tests                            |
| `npm run test:property`    | fast-check property tests                    |
| `npm run lint`             | ESLint, zero warnings tolerated              |
| `npm run typecheck`        | `tsc --noEmit`                               |
| `npm run format`           | Apply Prettier                               |
| `npm run schemas:generate` | Regenerate types after editing a JSON schema |

## What a component contribution must include

Components are validated against a _total_ contract — `ComponentRecord` in
`packages/components/src/contracts/types.ts`. There is no partial variant, so a component is not
mergeable until all of it is present:

- Editable React + Tailwind source, one exported component per file, in its category directory.
- An exported `*Props` interface, mirrored as `PropDefinition[]` so docs and Registry cannot drift
  from the real props.
- Every one of the seven `BehaviorKey` dimensions (`keyboard`, `pointer`, `focus`, `disabled`,
  `loading`, `validation`, `error`) marked either `supported` with a contract description or
  `not_applicable` with a reason.
- An accessibility-primitive declaration: either an exact-version compatible-license primitive
  with provenance, or an explicit "no external primitive".
- A capability/fallback declaration: either an optional browser capability with its detector and
  a functional fallback that preserves content and primary actions, or an explicit "no optional
  capability".
- A reduced-motion declaration.
- At least one renderable example.
- Tests covering every declared state, keyboard and pointer path, focus behavior, and fallback.

Accessibility is not a follow-up task. A component that is not keyboard operable, or that hides
state from assistive technology, cannot reach `stable`.

## Style

Formatting and linting are enforced, so match what the tools produce rather than hand-styling.
Two conventions the tools do not catch:

- Comments explain _why_, especially where a rule looks arbitrary. Traceability comments that
  reference a requirement or property (`Requirement 15.4`, `Property 6`) are load-bearing — keep
  them accurate rather than deleting them.
- Validators accumulate every error and return them together, rather than failing on the first
  problem. Follow the existing pattern in `packages/catalog-core`.

## Pull requests

- One logical change per pull request.
- Describe what you changed, why, and how you verified it.
- Include tests. A bug fix should include a test that fails before your change.
- Note any behavior visible in a public contract, since that decides the version bump.

## Security

Do not open a public issue for a vulnerability. Follow [SECURITY.md](./SECURITY.md).

## Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
