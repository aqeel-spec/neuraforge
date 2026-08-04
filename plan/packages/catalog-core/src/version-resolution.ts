import type {
  ArtifactKind,
  ArtifactRef,
  Checksum,
  FieldError,
  Result,
  SemanticVersion,
} from "@neuraforge/schemas";

import { buildValidationErrorEnvelope, type ValidationContext } from "./errors.js";

/**
 * Immutable-snapshot reading and exact-version resolution.
 *
 * Implements Requirements 7.1, 7.9, 7.10, 8.7, and 13.9 through 13.12, and Property 20:
 * retrieval succeeds only for an exact version present in a selected immutable Registry
 * snapshot. A request for a version that was never published, or that fell outside the
 * supported-version policy, never silently falls back to "latest" bytes; instead it
 * returns the requested reference plus a support status, the last supported version in
 * the requested major line, the nearest Supported Release target, an applicable
 * migration, and/or published alternatives.
 */

interface ParsedSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | undefined;
}

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** Parses a strict, exact Semantic Version (no ranges, wildcards, build tags, or moving targets). */
function parseExactSemVer(value: string): ParsedSemVer | null {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

/** Returns true only for a version string that names one exact, resolvable Semantic Version. */
export function isExactSemanticVersion(value: unknown): value is SemanticVersion {
  return typeof value === "string" && parseExactSemVer(value) !== null;
}

function compareParsedSemVer(a: ParsedSemVer, b: ParsedSemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease < b.prerelease ? -1 : 1;
}

/** Compares two exact Semantic Versions; throws only if a value is not an exact Semantic Version. */
export function compareSemanticVersions(a: SemanticVersion, b: SemanticVersion): number {
  const parsedA = parseExactSemVer(a);
  const parsedB = parseExactSemVer(b);
  if (!parsedA || !parsedB) {
    throw new TypeError("compareSemanticVersions requires two exact Semantic Versions");
  }
  return compareParsedSemVer(parsedA, parsedB);
}

function sortRefsDescending(refs: readonly ArtifactRef[]): ArtifactRef[] {
  return [...refs].sort((a, b) => {
    const parsedA = parseExactSemVer(a.version);
    const parsedB = parseExactSemVer(b.version);
    if (!parsedA || !parsedB) return 0;
    return compareParsedSemVer(parsedB, parsedA);
  });
}

/** One immutable, checksum-verified entry published into a Registry snapshot. */
export interface CatalogEntry {
  ref: ArtifactRef;
  checksum: Checksum;
}

/** A published version range that remains within the exact support window (Requirement 13.6). */
export interface SupportedReleaseRange {
  kind: ArtifactKind;
  stableId: string;
  /** Inclusive lower bound of the supported line. */
  startVersion: SemanticVersion;
  /** Inclusive upper bound; open-ended (still supported) when omitted. */
  endVersion?: SemanticVersion;
}

/** A published machine/human migration for an incompatible schema, operation, or deprecation (Requirement 13.13). */
export interface MigrationRecord {
  kind: ArtifactKind;
  stableId: string;
  fromVersion: SemanticVersion;
  toVersion: SemanticVersion;
  machineReadableGuideRef: string;
  humanReadableGuideRef: string;
}

/**
 * The pure, immutable inputs a version-resolution query is evaluated against: every
 * entry ever published for the queried Registry version, plus the supported-version
 * policy and migrations that apply across releases. None of these inputs are mutated by
 * resolution; the same inputs always resolve identically (Property 20, Property 21).
 */
export interface CatalogSnapshot {
  registryVersion: SemanticVersion;
  entries: readonly CatalogEntry[];
  supportedReleaseRanges?: readonly SupportedReleaseRange[];
  migrations?: readonly MigrationRecord[];
}

export interface VersionResolutionRequest {
  kind: ArtifactKind;
  stableId: string;
  version: string;
}

export interface ResolvedVersion {
  entry: CatalogEntry;
  supportStatus: "supported" | "unspecified";
}

export type VersionResolutionMiss =
  | {
      reason: "unpublished";
      requested: ArtifactRef;
      alternatives: ArtifactRef[];
    }
  | {
      reason: "unsupported";
      requested: ArtifactRef;
      lastSupportedVersionInRequestedLine?: SemanticVersion;
      nearestSupportedTarget?: ArtifactRef;
      migration?: MigrationRecord;
      alternatives: ArtifactRef[];
    };

export type VersionResolutionOutcome =
  | { resolved: true; version: ResolvedVersion }
  | { resolved: false; miss: VersionResolutionMiss };

function findEntriesForStableId(
  snapshot: CatalogSnapshot,
  kind: ArtifactKind,
  stableId: string,
): CatalogEntry[] {
  return snapshot.entries.filter(
    (entry) => entry.ref.kind === kind && entry.ref.stableId === stableId,
  );
}

function findSupportedRanges(
  snapshot: CatalogSnapshot,
  kind: ArtifactKind,
  stableId: string,
): SupportedReleaseRange[] {
  return (snapshot.supportedReleaseRanges ?? []).filter(
    (range) => range.kind === kind && range.stableId === stableId,
  );
}

function isWithinRange(version: ParsedSemVer, range: SupportedReleaseRange): boolean {
  const start = parseExactSemVer(range.startVersion);
  if (!start || compareParsedSemVer(version, start) < 0) return false;
  if (range.endVersion === undefined) return true;
  const end = parseExactSemVer(range.endVersion);
  return end !== null && compareParsedSemVer(version, end) <= 0;
}

/** Finds the migration whose `fromVersion` exactly matches the requested unsupported version, if any. */
function findMigration(
  snapshot: CatalogSnapshot,
  kind: ArtifactKind,
  stableId: string,
  fromVersion: SemanticVersion,
): MigrationRecord | undefined {
  return (snapshot.migrations ?? []).find(
    (migration) =>
      migration.kind === kind &&
      migration.stableId === stableId &&
      migration.fromVersion === fromVersion,
  );
}

/** The highest supported version sharing the requested version's major line, if one exists. */
function lastSupportedVersionInRequestedLine(
  supportedEntries: readonly CatalogEntry[],
  requestedMajor: number,
): SemanticVersion | undefined {
  const sameLine = supportedEntries.filter(
    (entry) => parseExactSemVer(entry.ref.version)?.major === requestedMajor,
  );
  if (sameLine.length === 0) return undefined;
  return sortRefsDescending(sameLine.map((entry) => entry.ref))[0]?.version;
}

/** The supported version with the smallest absolute distance to the requested version, ties favor the higher version. */
function nearestSupportedTarget(
  supportedEntries: readonly CatalogEntry[],
  requested: ParsedSemVer,
): ArtifactRef | undefined {
  if (supportedEntries.length === 0) return undefined;
  let best: { ref: ArtifactRef; distance: number } | undefined;
  for (const entry of supportedEntries) {
    const parsed = parseExactSemVer(entry.ref.version);
    if (!parsed) continue;
    const distance =
      Math.abs(parsed.major - requested.major) * 1_000_000 +
      Math.abs(parsed.minor - requested.minor) * 1_000 +
      Math.abs(parsed.patch - requested.patch);
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance &&
        compareSemanticVersions(entry.ref.version, best.ref.version) > 0)
    ) {
      best = { ref: entry.ref, distance };
    }
  }
  return best?.ref;
}

/**
 * Resolves one exact-version request against one immutable catalog snapshot.
 *
 * Never matches a range, tag, or "latest": a non-exact `version` is a miss with reason
 * `"unpublished"` and no alternatives are substituted for the requested bytes. Publishing
 * more entries or changing supported ranges never mutates a prior resolution because the
 * snapshot itself is treated as immutable input.
 */
export function resolveArtifactVersion(
  snapshot: CatalogSnapshot,
  request: VersionResolutionRequest,
): VersionResolutionOutcome {
  const requested: ArtifactRef = {
    kind: request.kind,
    stableId: request.stableId,
    version: request.version,
  };
  const stableIdEntries = findEntriesForStableId(snapshot, request.kind, request.stableId);
  const alternatives = sortRefsDescending(stableIdEntries.map((entry) => entry.ref));

  const parsedRequested = parseExactSemVer(request.version);
  if (!parsedRequested) {
    return { resolved: false, miss: { reason: "unpublished", requested, alternatives } };
  }

  const exactEntry = stableIdEntries.find((entry) => entry.ref.version === request.version);
  const ranges = findSupportedRanges(snapshot, request.kind, request.stableId);
  const supportedEntries =
    ranges.length === 0
      ? stableIdEntries
      : stableIdEntries.filter((entry) => {
          const parsedEntry = parseExactSemVer(entry.ref.version);
          return parsedEntry !== null && ranges.some((range) => isWithinRange(parsedEntry, range));
        });

  if (!exactEntry) {
    return { resolved: false, miss: { reason: "unpublished", requested, alternatives } };
  }

  if (ranges.length === 0 || ranges.some((range) => isWithinRange(parsedRequested, range))) {
    return {
      resolved: true,
      version: {
        entry: exactEntry,
        supportStatus: ranges.length === 0 ? "unspecified" : "supported",
      },
    };
  }

  const lastSupportedInLine = lastSupportedVersionInRequestedLine(
    supportedEntries,
    parsedRequested.major,
  );
  const nearestTarget = nearestSupportedTarget(supportedEntries, parsedRequested);
  const migration = findMigration(snapshot, request.kind, request.stableId, request.version);

  return {
    resolved: false,
    miss: {
      reason: "unsupported",
      requested,
      alternatives,
      ...(lastSupportedInLine !== undefined
        ? { lastSupportedVersionInRequestedLine: lastSupportedInLine }
        : {}),
      ...(nearestTarget !== undefined ? { nearestSupportedTarget: nearestTarget } : {}),
      ...(migration !== undefined ? { migration } : {}),
    },
  };
}

function toResourceRef(ref: ArtifactRef): { kind: string; id: string; version: string } {
  return { kind: ref.kind, id: ref.stableId, version: ref.version };
}

/**
 * Result-wrapped entry point for adapters (Public API, MCP core, CLI) that need an
 * `ErrorEnvelope` for a version-resolution miss rather than the raw outcome. Every miss
 * category is reported through the shared `not_found` error contract: the requested
 * reference, published alternatives, and (for unsupported releases) support status,
 * migration, and nearest target land in `details` alongside `alternatives`.
 */
export function checkArtifactVersion(
  snapshot: CatalogSnapshot,
  request: VersionResolutionRequest,
  context: ValidationContext,
): Result<ResolvedVersion> {
  const outcome = resolveArtifactVersion(snapshot, request);
  if (outcome.resolved) {
    return { ok: true, value: outcome.version };
  }

  const { miss } = outcome;
  if (miss.reason === "unpublished") {
    return {
      ok: false,
      error: {
        error: {
          code: "version_not_found",
          category: "not_found",
          message:
            "The requested artifact version is not an exact published version in this Registry snapshot.",
          retryable: false,
          resource: toResourceRef(miss.requested),
          alternatives: miss.alternatives,
          requestId: context.requestId,
        },
      },
    };
  }

  return {
    ok: false,
    error: {
      error: {
        code: "unsupported_release",
        category: "not_found",
        message:
          "The requested artifact version is published but is outside the exact support window.",
        retryable: false,
        resource: toResourceRef(miss.requested),
        alternatives: miss.alternatives,
        details: {
          supportStatus: "unsupported",
          ...(miss.lastSupportedVersionInRequestedLine !== undefined
            ? { lastSupportedVersionInRequestedLine: miss.lastSupportedVersionInRequestedLine }
            : {}),
          ...(miss.nearestSupportedTarget !== undefined
            ? { nearestSupportedTarget: { ...miss.nearestSupportedTarget } }
            : {}),
          ...(miss.migration !== undefined ? { migration: { ...miss.migration } } : {}),
        },
        requestId: context.requestId,
      },
    },
  };
}

/** One immutable Registry snapshot addressable by its exact `registryVersion`. */
export interface RegistrySnapshotIndexEntry<S> {
  registryVersion: SemanticVersion;
  snapshot: S;
}

/**
 * Resolves an exact Registry snapshot version from an immutable list of published
 * snapshots (the "immutable catalog reading" half of this module): retrieval succeeds
 * only for an exact `registryVersion` already present in the list. An unknown or
 * non-exact version never falls back to the newest snapshot; it returns every published
 * Registry version as an alternative instead.
 */
export function resolveRegistrySnapshot<S>(
  snapshots: readonly RegistrySnapshotIndexEntry<S>[],
  requestedVersion: string,
  context: ValidationContext,
): Result<S> {
  if (!isExactSemanticVersion(requestedVersion)) {
    const fieldErrors: FieldError[] = [
      {
        code: "registry_version_not_exact",
        path: "registryVersion",
        constraint: "must be one exact published Semantic Version",
        guidance: 'Request one exact Registry version rather than a range, tag, or "latest".',
      },
    ];
    return {
      ok: false,
      error: buildValidationErrorEnvelope(
        "registry_version_not_exact",
        "The requested Registry version must be one exact published Semantic Version.",
        fieldErrors,
        { kind: "registry-snapshot", version: requestedVersion },
        context,
      ),
    };
  }

  const match = snapshots.find((entry) => entry.registryVersion === requestedVersion);
  if (match) {
    return { ok: true, value: match.snapshot };
  }

  const alternatives = [...snapshots]
    .sort((a, b) => compareSemanticVersions(b.registryVersion, a.registryVersion))
    .map((entry) => entry.registryVersion);

  return {
    ok: false,
    error: {
      error: {
        code: "registry_snapshot_not_found",
        category: "not_found",
        message: "The requested Registry snapshot version is not published.",
        retryable: false,
        resource: { kind: "registry-snapshot", version: requestedVersion },
        details: { publishedRegistryVersions: alternatives },
        requestId: context.requestId,
      },
    },
  };
}
