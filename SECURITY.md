# Security Policy

## Reporting a vulnerability

**Please do not open a public issue, pull request, or discussion for a security vulnerability.**

Report it privately through GitHub:

1. Go to the [Security tab](https://github.com/aqeel-spec/neuraforge/security/advisories/new).
2. Choose **Report a vulnerability**.

That opens a private advisory visible only to you and the maintainers, and needs no email address
from either side.

<!-- MAINTAINER TODO: GitHub private vulnerability reporting must be enabled for this repository
     (Settings -> Code security -> Private vulnerability reporting), otherwise the link above
     will not work and this policy has no working intake route. If you also want to publish a
     security mailbox, add it here only once it is provisioned and monitored — a published
     address that bounces is worse than no address. -->

Please include, as far as you can determine it:

- The affected surface (Registry, Public API, CLI, MCP server, npm package, docs, self-hosted
  deployment) and the exact version.
- What an attacker can do, and what access they need to do it.
- Steps to reproduce, ideally a minimal case.
- Any suggested mitigation.

## What to expect

| Stage                                                | Target                 |
| ---------------------------------------------------- | ---------------------- |
| Acknowledgement that the report was received         | 3 calendar days        |
| Initial assessment, including whether it is in scope | 10 calendar days       |
| Status update while a fix is in progress             | Every 14 calendar days |

Reports are handled confidentially. We will tell you when a fix is released and, unless you
prefer otherwise, credit you in the advisory.

Please give us a reasonable chance to release a fix before disclosing publicly. We will not
pursue or support legal action against good-faith research that respects this policy and does not
degrade service for others or access data that is not yours.

## Supported versions

Only published, exact versions are supported. Because published releases are immutable, a
security fix always ships as a **new version** — a supported release is never edited in place.

The set of currently supported releases and their support windows are published as machine-
readable policy records in `plan/packages/release-policy`, which is the authoritative source.

## Scope

In scope:

- The Registry, Public API, CLI, MCP server, npm package output, documentation site, and the
  self-hosting runtime in this repository.
- Integrity failures: anything that lets unverified or substituted content be presented,
  installed, or served as if it were a published artifact.
- Path traversal or archive escape during installation.
- Anything that causes the CLI or MCP server to write outside the paths shown in an approved
  preview.
- Any privacy failure that transmits telemetry without consent, or that transmits an excluded
  category (source code, prompts, Brand Config values, file paths, secrets, credentials, or
  personal data).
- Anything that makes a public artifact require an account, key, or entitlement.

Out of scope:

- Vulnerabilities in a dependency with no exploitable path through this project. Report those
  upstream; tell us if we should pin or patch.
- Findings that require an already-compromised developer machine or a maliciously modified local
  checkout.
- Missing hardening headers on the documentation site with no demonstrated impact.
- Automated scanner output with no demonstrated impact.
- Denial of service against the optional hosted service through ordinary quota consumption. Quota
  limits are a billing boundary, not a security boundary.

## Threat model

The assumptions this project defends are published alongside the policy records in
`plan/packages/release-policy`. In short: the Registry is public and unauthenticated by design,
so confidentiality of artifacts is explicitly **not** a security property. Integrity and
availability of exact published versions are.
