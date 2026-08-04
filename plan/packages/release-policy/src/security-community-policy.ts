import type { FieldError } from "@neuraforge/schemas";

import { addCalendarDays, type CalendarWindow, type PublicProcessLink } from "./governance.js";

/**
 * Machine-validated security and community policy records.
 *
 * Confidential security and conduct data (raw Security_Report and conduct-report
 * contents) is modeled with `Restricted*` types. These types are never returned by
 * a `render*` function. Only explicitly allowlisted, safe lifecycle fields are
 * projected into public records such as `SecurityAdvisory` and `ConductPolicy`.
 */

export interface PolicyValidation {
  valid: boolean;
  errors: FieldError[];
}

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const list = (value: unknown): value is unknown[] => Array.isArray(value);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function error(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

function requireText(errors: FieldError[], value: unknown, path: string): void {
  if (!text(value)) {
    error(errors, "required", path, "must be a non-empty string", `Provide ${path}.`);
  }
}

function requireTextList(errors: FieldError[], value: unknown, path: string): void {
  if (!list(value) || value.length === 0) {
    error(
      errors,
      "non_empty_list_required",
      path,
      "must contain at least one entry",
      `Publish at least one ${path} entry.`,
    );
    return;
  }
  value.forEach((entry, index) => {
    requireText(errors, entry, `${path}[${String(index)}]`);
  });
}

function isCalendarDate(value: unknown): value is string {
  if (!text(value) || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateDate(errors: FieldError[], value: unknown, path: string): value is string {
  if (isCalendarDate(value)) return true;
  error(
    errors,
    "invalid_calendar_date",
    path,
    "must be a real YYYY-MM-DD calendar date",
    "Publish the date without a time or time zone.",
  );
  return false;
}

function validateOptionalDate(
  errors: FieldError[],
  value: unknown,
  path: string,
): value is string | undefined {
  if (value === undefined) return true;
  return validateDate(errors, value, path);
}

function validateCalendarWindow(errors: FieldError[], value: unknown, path: string): void {
  const window = value as Partial<CalendarWindow> | undefined;
  if (!window || window.unit !== "calendar_days") {
    error(
      errors,
      "calendar_days_required",
      `${path}.unit`,
      'must equal "calendar_days"',
      "Measure this window in calendar days.",
    );
  }
  if (!window || !Number.isInteger(window.value) || (window.value ?? 0) < 1) {
    error(
      errors,
      "invalid_calendar_window",
      `${path}.value`,
      "must be a positive integer",
      "Provide at least one calendar day.",
    );
  }
}

function validatePublicLink(errors: FieldError[], value: unknown, path: string): void {
  const link = value as Partial<PublicProcessLink> | undefined;
  if (!link || link.visibility !== "public") {
    error(
      errors,
      "public_path_required",
      `${path}.visibility`,
      'must equal "public"',
      "Publish this process without authentication or payment.",
    );
  }
  if (!link || !text(link.url) || !(link.url.startsWith("/") || link.url.startsWith("https://"))) {
    error(
      errors,
      "invalid_public_path",
      `${path}.url`,
      "must be an absolute site path or HTTPS URL",
      "Provide the public repository or documentation path.",
    );
  }
}

function allowlist<T, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const projected = {} as Pick<T, K>;
  keys.forEach((key) => {
    projected[key] = source[key];
  });
  return projected;
}

/** Minimal SemVer comparison limited to major.minor.patch precedence. */
const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;

function parseSemVer(value: unknown): { major: number; minor: number; patch: number } | null {
  if (typeof value !== "string") return null;
  const match = SEMVER_PATTERN.exec(value);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function compareSemVer(
  a: { major: number; minor: number; patch: number },
  b: { major: number; minor: number; patch: number },
): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export interface SupportedReleaseRange {
  startVersion: string;
  endVersion?: string;
}

export function isVersionSupported(version: string, ranges: SupportedReleaseRange[]): boolean {
  const parsedVersion = parseSemVer(version);
  if (!parsedVersion) return false;
  return ranges.some((range) => {
    const start = parseSemVer(range.startVersion);
    if (!start || compareSemVer(parsedVersion, start) < 0) return false;
    if (range.endVersion === undefined) return true;
    const end = parseSemVer(range.endVersion);
    return end !== null && compareSemVer(parsedVersion, end) <= 0;
  });
}

// ---------------------------------------------------------------------------
// Requirement 11.1: Security policy
// ---------------------------------------------------------------------------

export interface SeverityDefinition {
  level: string;
  description: string;
}

export interface SecurityPolicy {
  schemaVersion: string;
  supportedReleaseRanges: SupportedReleaseRange[];
  acknowledgementDeadline: CalendarWindow;
  triageDeadline: CalendarWindow;
  reporterUpdateInterval: CalendarWindow;
  disclosureProcess: PublicProcessLink;
  severityDefinitions: SeverityDefinition[];
}

export function validateSecurityPolicy(policy: SecurityPolicy): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, policy.schemaVersion, "schemaVersion");
  if (!list(policy.supportedReleaseRanges) || policy.supportedReleaseRanges.length === 0) {
    error(
      errors,
      "supported_release_ranges_required",
      "supportedReleaseRanges",
      "must contain at least one exact Supported Release range",
      "Publish the exact supported release ranges.",
    );
  } else {
    policy.supportedReleaseRanges.forEach((range, index) => {
      if (!parseSemVer(range.startVersion)) {
        error(
          errors,
          "invalid_semantic_version",
          `supportedReleaseRanges[${String(index)}].startVersion`,
          "must be a Semantic Version",
          "Publish an exact Semantic Version.",
        );
      }
      if (range.endVersion !== undefined && !parseSemVer(range.endVersion)) {
        error(
          errors,
          "invalid_semantic_version",
          `supportedReleaseRanges[${String(index)}].endVersion`,
          "must be a Semantic Version",
          "Publish an exact Semantic Version.",
        );
      }
    });
  }
  validateCalendarWindow(errors, policy.acknowledgementDeadline, "acknowledgementDeadline");
  validateCalendarWindow(errors, policy.triageDeadline, "triageDeadline");
  validateCalendarWindow(errors, policy.reporterUpdateInterval, "reporterUpdateInterval");
  validatePublicLink(errors, policy.disclosureProcess, "disclosureProcess");
  if (!list(policy.severityDefinitions) || policy.severityDefinitions.length === 0) {
    error(
      errors,
      "severity_definitions_required",
      "severityDefinitions",
      "must define at least one severity level",
      "Publish severity definitions.",
    );
  } else {
    const levels = new Set<string>();
    policy.severityDefinitions.forEach((definition, index) => {
      requireText(errors, definition.level, `severityDefinitions[${String(index)}].level`);
      requireText(
        errors,
        definition.description,
        `severityDefinitions[${String(index)}].description`,
      );
      if (levels.has(definition.level)) {
        error(
          errors,
          "duplicate_severity_level",
          `severityDefinitions[${String(index)}].level`,
          "must be unique",
          "Publish each severity level once.",
        );
      }
      levels.add(definition.level);
    });
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 11.2: Private initial-reporting channel (routing metadata)
// ---------------------------------------------------------------------------

export interface PrivateReportChannel {
  schemaVersion: string;
  channelType: "email" | "form" | "advisory-platform";
  contactReference: string;
  confidentialityNotice: string;
  encryptionKeyReference?: string;
}

const CHANNEL_TYPES = new Set(["email", "form", "advisory-platform"]);

export function validatePrivateReportChannel(channel: PrivateReportChannel): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, channel.schemaVersion, "schemaVersion");
  if (!CHANNEL_TYPES.has(channel.channelType)) {
    error(
      errors,
      "invalid_channel_type",
      "channelType",
      'must be "email", "form", or "advisory-platform"',
      "Publish a supported private-reporting channel type.",
    );
  }
  requireText(errors, channel.contactReference, "contactReference");
  requireText(errors, channel.confidentialityNotice, "confidentialityNotice");
  if (channel.encryptionKeyReference !== undefined) {
    requireText(errors, channel.encryptionKeyReference, "encryptionKeyReference");
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 11.3: Threat model
// ---------------------------------------------------------------------------

export const THREAT_MODEL_SURFACES = [
  "registry",
  "public-api",
  "cli",
  "npm-package",
  "mcp-server",
  "hosted-mcp-service",
  "self-hosted-deployment",
] as const;

export type ThreatModelSurfaceId = (typeof THREAT_MODEL_SURFACES)[number];

export interface ThreatModelSurfaceEntry {
  protectedAssets: string[];
  trustBoundaries: string[];
  threatActors: string[];
  abuseCases: string[];
  mitigations: string[];
  residualRisks: string[];
}

export interface ThreatModel {
  schemaVersion: string;
  surfaces: Partial<Record<ThreatModelSurfaceId, ThreatModelSurfaceEntry>>;
}

export function validateThreatModel(model: ThreatModel): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, model.schemaVersion, "schemaVersion");
  THREAT_MODEL_SURFACES.forEach((surfaceId) => {
    const entry = model.surfaces[surfaceId];
    if (!entry) {
      error(
        errors,
        "missing_threat_model_surface",
        `surfaces.${surfaceId}`,
        "must be present",
        `Publish a threat model entry for ${surfaceId}.`,
      );
      return;
    }
    requireTextList(errors, entry.protectedAssets, `surfaces.${surfaceId}.protectedAssets`);
    requireTextList(errors, entry.trustBoundaries, `surfaces.${surfaceId}.trustBoundaries`);
    requireTextList(errors, entry.threatActors, `surfaces.${surfaceId}.threatActors`);
    requireTextList(errors, entry.abuseCases, `surfaces.${surfaceId}.abuseCases`);
    requireTextList(errors, entry.mitigations, `surfaces.${surfaceId}.mitigations`);
    requireTextList(errors, entry.residualRisks, `surfaces.${surfaceId}.residualRisks`);
  });
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 11.4: Restricted Security_Report lifecycle (confidential)
// ---------------------------------------------------------------------------

export interface SecurityReportUpdate {
  at: string;
  summary: string;
}

/**
 * Restricted record. Contains only lifecycle timestamps and internal update
 * summaries; reporter identity and raw technical report content are intentionally
 * excluded from this module's scope and MUST NOT be added here. Never render this
 * type directly to a public surface — use `renderSecurityAdvisory`.
 */
export interface RestrictedSecurityReportLifecycle {
  reportId: string;
  receivedAt: string;
  acknowledgedAt?: string;
  triagedAt?: string;
  updates: SecurityReportUpdate[];
  disclosureCoordinatedAt?: string;
}

export function validateSecurityReportLifecycle(
  policy: SecurityPolicy,
  lifecycle: RestrictedSecurityReportLifecycle,
  asOf: string,
): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, lifecycle.reportId, "reportId");
  const receivedValid = validateDate(errors, lifecycle.receivedAt, "receivedAt");
  const acknowledgedValid = validateOptionalDate(
    errors,
    lifecycle.acknowledgedAt,
    "acknowledgedAt",
  );
  const triagedValid = validateOptionalDate(errors, lifecycle.triagedAt, "triagedAt");
  const disclosedValid = validateOptionalDate(
    errors,
    lifecycle.disclosureCoordinatedAt,
    "disclosureCoordinatedAt",
  );
  const asOfValid = validateDate(errors, asOf, "asOf");
  if (!list(lifecycle.updates)) {
    error(
      errors,
      "updates_required",
      "updates",
      "must be an array",
      "Publish an update log for the report lifecycle.",
    );
  } else {
    lifecycle.updates.forEach((update, index) => {
      validateDate(errors, update.at, `updates[${String(index)}].at`);
      requireText(errors, update.summary, `updates[${String(index)}].summary`);
    });
  }

  if (receivedValid && asOfValid) {
    const ackDeadline = addCalendarDays(lifecycle.receivedAt, policy.acknowledgementDeadline.value);
    if (acknowledgedValid && lifecycle.acknowledgedAt) {
      if (lifecycle.acknowledgedAt > ackDeadline) {
        error(
          errors,
          "acknowledgement_overdue",
          "acknowledgedAt",
          `must not be later than ${ackDeadline}`,
          "Acknowledge Security Reports within the published deadline.",
        );
      }
    } else if (asOf > ackDeadline) {
      error(
        errors,
        "acknowledgement_overdue",
        "acknowledgedAt",
        `must be recorded by ${ackDeadline}`,
        "Acknowledge the Security Report before the published deadline.",
      );
    }
  }

  if (acknowledgedValid && lifecycle.acknowledgedAt && asOfValid) {
    const triageDeadline = addCalendarDays(lifecycle.acknowledgedAt, policy.triageDeadline.value);
    if (triagedValid && lifecycle.triagedAt) {
      if (lifecycle.triagedAt > triageDeadline) {
        error(
          errors,
          "triage_overdue",
          "triagedAt",
          `must not be later than ${triageDeadline}`,
          "Triage acknowledged Security Reports within the published deadline.",
        );
      }
    } else if (asOf > triageDeadline) {
      error(
        errors,
        "triage_overdue",
        "triagedAt",
        `must be recorded by ${triageDeadline}`,
        "Triage the Security Report before the published deadline.",
      );
    }
  }

  if (!disclosedValid || !lifecycle.disclosureCoordinatedAt) {
    const lastEventAt = [lifecycle.triagedAt, lifecycle.acknowledgedAt, lifecycle.receivedAt].find(
      (candidate): candidate is string => typeof candidate === "string",
    );
    const lastUpdateAt =
      lifecycle.updates.length > 0
        ? lifecycle.updates[lifecycle.updates.length - 1]?.at
        : undefined;
    const baseline =
      lastUpdateAt && lastUpdateAt > (lastEventAt ?? "") ? lastUpdateAt : lastEventAt;
    if (baseline && asOfValid) {
      const nextUpdateDeadline = addCalendarDays(baseline, policy.reporterUpdateInterval.value);
      if (asOf > nextUpdateDeadline) {
        error(
          errors,
          "reporter_update_overdue",
          "updates",
          `must add an update by ${nextUpdateDeadline}`,
          "Publish a reporter update within the published update interval until disclosure.",
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirements 11.5, 11.6, 11.12: Public security advisory
// ---------------------------------------------------------------------------

export interface FixedVersionRecord {
  version: string;
  checksum: string;
}

export interface SecurityAdvisory {
  id: string;
  affectedVersions: string[];
  severity: "low" | "medium" | "high" | "critical";
  impact: string;
  workarounds: string[];
  remediationStatus: "unresolved" | "in_progress" | "resolved";
  disclosureTimeline: {
    reportedAt: string;
    acknowledgedAt: string;
    triagedAt: string;
    disclosedAt: string;
  };
  fixedVersions?: FixedVersionRecord[];
  migrationActions?: string[];
  supportedReleaseTarget?: string;
}

const SEVERITY_LEVELS = new Set(["low", "medium", "high", "critical"]);

export function validateSecurityAdvisory(
  advisory: SecurityAdvisory,
  policy: SecurityPolicy,
): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, advisory.id, "id");
  if (!list(advisory.affectedVersions) || advisory.affectedVersions.length === 0) {
    error(
      errors,
      "affected_versions_required",
      "affectedVersions",
      "must list at least one affected version",
      "Publish every affected version.",
    );
  } else {
    advisory.affectedVersions.forEach((version, index) => {
      if (!parseSemVer(version)) {
        error(
          errors,
          "invalid_semantic_version",
          `affectedVersions[${String(index)}]`,
          "must be a Semantic Version",
          "Publish an exact Semantic Version.",
        );
      }
    });
  }
  if (!SEVERITY_LEVELS.has(advisory.severity)) {
    error(
      errors,
      "invalid_severity",
      "severity",
      'must be "low", "medium", "high", or "critical"',
      "Publish a defined severity level.",
    );
  }
  requireText(errors, advisory.impact, "impact");
  if (!list(advisory.workarounds)) {
    error(
      errors,
      "workarounds_required",
      "workarounds",
      "must be an array",
      "Publish available workarounds, or an empty array if none exist.",
    );
  }
  const timeline = advisory.disclosureTimeline;
  const reportedValid = validateDate(errors, timeline.reportedAt, "disclosureTimeline.reportedAt");
  const acknowledgedValid = validateDate(
    errors,
    timeline.acknowledgedAt,
    "disclosureTimeline.acknowledgedAt",
  );
  const triagedValid = validateDate(errors, timeline.triagedAt, "disclosureTimeline.triagedAt");
  const disclosedValid = validateDate(
    errors,
    timeline.disclosedAt,
    "disclosureTimeline.disclosedAt",
  );
  if (reportedValid && acknowledgedValid && triagedValid && disclosedValid) {
    if (
      !(
        timeline.reportedAt <= timeline.acknowledgedAt &&
        timeline.acknowledgedAt <= timeline.triagedAt &&
        timeline.triagedAt <= timeline.disclosedAt
      )
    ) {
      error(
        errors,
        "disorder_disclosure_timeline",
        "disclosureTimeline",
        "must record reported, acknowledged, triaged, and disclosed dates in order",
        "Publish the disclosure timeline in chronological order.",
      );
    }
  }

  if (advisory.remediationStatus === "resolved") {
    if (!list(advisory.fixedVersions) || advisory.fixedVersions.length === 0) {
      error(
        errors,
        "fixed_versions_required",
        "fixedVersions",
        "resolved advisories require at least one fixed version and checksum",
        "Publish the exact fixed versions and checksums.",
      );
    } else {
      advisory.fixedVersions.forEach((fixed, index) => {
        if (!parseSemVer(fixed.version)) {
          error(
            errors,
            "invalid_semantic_version",
            `fixedVersions[${String(index)}].version`,
            "must be a Semantic Version",
            "Publish an exact fixed Semantic Version.",
          );
        }
        requireText(errors, fixed.checksum, `fixedVersions[${String(index)}].checksum`);
      });
    }
    if (!list(advisory.migrationActions) || advisory.migrationActions.length === 0) {
      error(
        errors,
        "migration_actions_required",
        "migrationActions",
        "resolved advisories require at least one migration action",
        "Publish the required migration actions.",
      );
    }
  } else if (advisory.fixedVersions !== undefined || advisory.migrationActions !== undefined) {
    error(
      errors,
      "premature_fix_metadata",
      "remediationStatus",
      'must equal "resolved" before publishing fixed versions or migration actions',
      "Publish fixed versions and migrations only once a remediation Release is available.",
    );
  }

  if (list(advisory.affectedVersions)) {
    const hasUnsupportedAffectedVersion = advisory.affectedVersions.some(
      (version) =>
        parseSemVer(version) !== null &&
        !isVersionSupported(version, policy.supportedReleaseRanges),
    );
    if (hasUnsupportedAffectedVersion) {
      if (!text(advisory.supportedReleaseTarget)) {
        error(
          errors,
          "supported_release_target_required",
          "supportedReleaseTarget",
          "advisories affecting an unsupported Release require the nearest Supported Release remediation target",
          "Publish the nearest Supported Release remediation target.",
        );
      } else if (
        !isVersionSupported(advisory.supportedReleaseTarget, policy.supportedReleaseRanges)
      ) {
        error(
          errors,
          "unsupported_release_target",
          "supportedReleaseTarget",
          "must itself be a Supported Release",
          "Publish a remediation target within the supported release ranges.",
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Projects a confidential Security_Report lifecycle plus reviewer-supplied public
 * fields into a safe, publishable Security Advisory. Reporter identity, raw report
 * content, and internal update summaries never appear in the returned value.
 */
export function renderSecurityAdvisory(
  lifecycle: RestrictedSecurityReportLifecycle,
  publicDetails: Pick<
    SecurityAdvisory,
    "id" | "affectedVersions" | "severity" | "impact" | "workarounds" | "remediationStatus"
  > &
    Partial<
      Pick<SecurityAdvisory, "fixedVersions" | "migrationActions" | "supportedReleaseTarget">
    >,
): SecurityAdvisory {
  if (!lifecycle.acknowledgedAt || !lifecycle.triagedAt || !lifecycle.disclosureCoordinatedAt) {
    throw new RangeError(
      "renderSecurityAdvisory requires an acknowledged, triaged, and disclosed report lifecycle",
    );
  }
  return {
    id: publicDetails.id,
    affectedVersions: publicDetails.affectedVersions,
    severity: publicDetails.severity,
    impact: publicDetails.impact,
    workarounds: publicDetails.workarounds,
    remediationStatus: publicDetails.remediationStatus,
    disclosureTimeline: {
      reportedAt: lifecycle.receivedAt,
      acknowledgedAt: lifecycle.acknowledgedAt,
      triagedAt: lifecycle.triagedAt,
      disclosedAt: lifecycle.disclosureCoordinatedAt,
    },
    ...(publicDetails.fixedVersions !== undefined
      ? { fixedVersions: publicDetails.fixedVersions }
      : {}),
    ...(publicDetails.migrationActions !== undefined
      ? { migrationActions: publicDetails.migrationActions }
      : {}),
    ...(publicDetails.supportedReleaseTarget !== undefined
      ? { supportedReleaseTarget: publicDetails.supportedReleaseTarget }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Requirement 10.9: Accessibility regression record
// ---------------------------------------------------------------------------

export interface AccessibilityRegressionRecord {
  id: string;
  affectedVersions: string[];
  userImpact: string;
  remediationStatus: "unresolved" | "in_progress" | "resolved";
  workaround: string;
}

export function validateAccessibilityRegressionRecord(
  record: AccessibilityRegressionRecord,
): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, record.id, "id");
  requireTextList(errors, record.affectedVersions, "affectedVersions");
  requireText(errors, record.userImpact, "userImpact");
  if (!["unresolved", "in_progress", "resolved"].includes(record.remediationStatus)) {
    error(
      errors,
      "invalid_remediation_status",
      "remediationStatus",
      'must be "unresolved", "in_progress", or "resolved"',
      "Publish a defined remediation status.",
    );
  }
  requireText(errors, record.workaround, "workaround");
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 16.1: Public policy index
// ---------------------------------------------------------------------------

export interface PublicPolicyIndex {
  schemaVersion: string;
  governanceModelPath: PublicProcessLink;
  contributionGuidePath: PublicProcessLink;
  codeOfConductPath: PublicProcessLink;
  maintainerListPath: PublicProcessLink;
  contributionTermsPath: PublicProcessLink;
  decisionProcessPath: PublicProcessLink;
  correctionProcessPath: PublicProcessLink;
}

const PUBLIC_POLICY_INDEX_LINK_FIELDS = [
  "governanceModelPath",
  "contributionGuidePath",
  "codeOfConductPath",
  "maintainerListPath",
  "contributionTermsPath",
  "decisionProcessPath",
  "correctionProcessPath",
] as const satisfies readonly (keyof PublicPolicyIndex)[];

export function validatePublicPolicyIndex(index: PublicPolicyIndex): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, index.schemaVersion, "schemaVersion");
  PUBLIC_POLICY_INDEX_LINK_FIELDS.forEach((field) => {
    validatePublicLink(errors, index[field], field);
  });
  return { valid: errors.length === 0, errors };
}

export function renderPublicPolicyIndex(index: PublicPolicyIndex): PublicPolicyIndex {
  return {
    schemaVersion: index.schemaVersion,
    ...allowlist(index, PUBLIC_POLICY_INDEX_LINK_FIELDS),
  };
}

// ---------------------------------------------------------------------------
// Requirement 16.8: Contribution terms
// ---------------------------------------------------------------------------

export interface ContributionTerms {
  schemaVersion: string;
  license: string;
  attributionPolicy: string;
  thirdPartyProvenancePolicy: string;
  contributorAuthorityStatement: string;
}

export function validateContributionTerms(terms: ContributionTerms): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, terms.schemaVersion, "schemaVersion");
  if (terms.license !== "MIT") {
    error(
      errors,
      "open_source_license_required",
      "license",
      'must equal "MIT"',
      "Preserve the Open Source License for accepted original contributions.",
    );
  }
  requireText(errors, terms.attributionPolicy, "attributionPolicy");
  requireText(errors, terms.thirdPartyProvenancePolicy, "thirdPartyProvenancePolicy");
  requireText(errors, terms.contributorAuthorityStatement, "contributorAuthorityStatement");
  return { valid: errors.length === 0, errors };
}

export function renderContributionTerms(terms: ContributionTerms): ContributionTerms {
  return {
    schemaVersion: terms.schemaVersion,
    license: terms.license,
    attributionPolicy: terms.attributionPolicy,
    thirdPartyProvenancePolicy: terms.thirdPartyProvenancePolicy,
    contributorAuthorityStatement: terms.contributorAuthorityStatement,
  };
}

// ---------------------------------------------------------------------------
// Requirement 16.7: Confidential conduct process (public process, private reports)
// ---------------------------------------------------------------------------

export interface ConductPolicy {
  schemaVersion: string;
  reportingContact: PublicProcessLink;
  accessControlRoles: string[];
  conflictOfInterestRule: string;
  recusalRule: string;
  retentionPeriod: CalendarWindow;
  appealPath: PublicProcessLink;
  enforcementProcess: string;
}

export function validateConductPolicy(policy: ConductPolicy): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, policy.schemaVersion, "schemaVersion");
  validatePublicLink(errors, policy.reportingContact, "reportingContact");
  requireTextList(errors, policy.accessControlRoles, "accessControlRoles");
  requireText(errors, policy.conflictOfInterestRule, "conflictOfInterestRule");
  requireText(errors, policy.recusalRule, "recusalRule");
  validateCalendarWindow(errors, policy.retentionPeriod, "retentionPeriod");
  validatePublicLink(errors, policy.appealPath, "appealPath");
  requireText(errors, policy.enforcementProcess, "enforcementProcess");
  return { valid: errors.length === 0, errors };
}

export function renderConductPolicy(policy: ConductPolicy): ConductPolicy {
  return {
    schemaVersion: policy.schemaVersion,
    reportingContact: policy.reportingContact,
    accessControlRoles: [...policy.accessControlRoles],
    conflictOfInterestRule: policy.conflictOfInterestRule,
    recusalRule: policy.recusalRule,
    retentionPeriod: policy.retentionPeriod,
    appealPath: policy.appealPath,
    enforcementProcess: policy.enforcementProcess,
  };
}

/**
 * Restricted record. Contains confidential conduct-report content. This type MUST
 * NEVER be returned by a public renderer; only `ConductPolicy` (the published
 * process) is safe to publish.
 */
export interface RestrictedConductReport {
  reportId: string;
  reportedAt: string;
  participantIds: string[];
  accessRoles: string[];
  details: string;
  recusals: { participantId: string; reason: string }[];
  retentionExpiresAt: string;
  outcome?: "no_action" | "warning" | "suspension" | "ban";
  decidedAt?: string;
}

export function validateRestrictedConductReport(report: RestrictedConductReport): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, report.reportId, "reportId");
  validateDate(errors, report.reportedAt, "reportedAt");
  requireTextList(errors, report.participantIds, "participantIds");
  requireTextList(errors, report.accessRoles, "accessRoles");
  requireText(errors, report.details, "details");
  report.recusals.forEach((recusal, index) => {
    requireText(errors, recusal.participantId, `recusals[${String(index)}].participantId`);
    requireText(errors, recusal.reason, `recusals[${String(index)}].reason`);
  });
  validateDate(errors, report.retentionExpiresAt, "retentionExpiresAt");
  if (
    report.outcome !== undefined &&
    !["no_action", "warning", "suspension", "ban"].includes(report.outcome)
  ) {
    error(
      errors,
      "invalid_outcome",
      "outcome",
      'must be "no_action", "warning", "suspension", or "ban"',
      "Record a defined enforcement outcome.",
    );
  }
  validateOptionalDate(errors, report.decidedAt, "decidedAt");
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 16.9: Maintainer list and public nomination lifecycle
// ---------------------------------------------------------------------------

export interface MaintainerRecord {
  id: string;
  displayName: string;
  role: string;
  responsibilities: string[];
  activeSince: string;
}

export function validateMaintainerList(maintainers: MaintainerRecord[]): PolicyValidation {
  const errors: FieldError[] = [];
  if (!list(maintainers) || maintainers.length === 0) {
    error(
      errors,
      "maintainer_list_required",
      "maintainers",
      "must publish at least one Maintainer",
      "Publish the current Maintainer list.",
    );
    return { valid: false, errors };
  }
  const ids = new Set<string>();
  maintainers.forEach((maintainer, index) => {
    requireText(errors, maintainer.id, `maintainers[${String(index)}].id`);
    requireText(errors, maintainer.displayName, `maintainers[${String(index)}].displayName`);
    requireText(errors, maintainer.role, `maintainers[${String(index)}].role`);
    requireTextList(
      errors,
      maintainer.responsibilities,
      `maintainers[${String(index)}].responsibilities`,
    );
    validateDate(errors, maintainer.activeSince, `maintainers[${String(index)}].activeSince`);
    if (ids.has(maintainer.id)) {
      error(
        errors,
        "duplicate_maintainer",
        `maintainers[${String(index)}].id`,
        "must be unique",
        "List each Maintainer once.",
      );
    }
    ids.add(maintainer.id);
  });
  return { valid: errors.length === 0, errors };
}

export function renderMaintainerList(maintainers: MaintainerRecord[]): MaintainerRecord[] {
  return maintainers.map((maintainer) => ({
    id: maintainer.id,
    displayName: maintainer.displayName,
    role: maintainer.role,
    responsibilities: [...maintainer.responsibilities],
    activeSince: maintainer.activeSince,
  }));
}

export interface MaintainerEligibilityCriteria {
  reviewWindow: CalendarWindow;
  decisionDeadline: CalendarWindow;
  appealWindow: CalendarWindow;
}
export interface NominationParticipant {
  id: string;
  role: string;
}
export interface NominationConflictDisclosure {
  participantId: string;
  status: "none" | "disclosed";
  details?: string;
  recused?: boolean;
}
export interface MaintainerNominationDecision {
  outcome: "approved" | "rejected";
  rationale: string;
  decisionMakers: NominationParticipant[];
  decisionDate: string;
  authorityId: string;
}
export interface MaintainerAppeal {
  filedAt: string;
  rationale: string;
  outcome?: "upheld" | "overturned";
  decidedAt?: string;
}

export interface MaintainerNomination {
  id: string;
  nomineeId: string;
  submittedAt: string;
  eligibilityEvidence: string[];
  status: "nominated" | "review" | "decided" | "appealed";
  schedule?: { reviewStart: string; reviewDeadline: string; decisionDeadline: string };
  reviewers: NominationParticipant[];
  conflictDisclosures: NominationConflictDisclosure[];
  decision?: MaintainerNominationDecision;
  appeal?: MaintainerAppeal;
}

function validateNominationParticipants(
  errors: FieldError[],
  participants: NominationParticipant[],
  disclosures: NominationConflictDisclosure[],
): void {
  if (!list(participants) || participants.length === 0) {
    error(
      errors,
      "reviewers_required",
      "reviewers",
      "must contain at least one reviewer",
      "Publish every Maintainer nomination reviewer.",
    );
    return;
  }
  const participantIds = new Set<string>();
  participants.forEach((participant, index) => {
    requireText(errors, participant.id, `reviewers[${String(index)}].id`);
    requireText(errors, participant.role, `reviewers[${String(index)}].role`);
    participantIds.add(participant.id);
  });
  const disclosureIds = new Set<string>();
  disclosures.forEach((disclosure, index) => {
    disclosureIds.add(disclosure.participantId);
    if (!participantIds.has(disclosure.participantId)) {
      error(
        errors,
        "unknown_conflict_participant",
        `conflictDisclosures[${String(index)}].participantId`,
        "must identify a published reviewer",
        "Remove the disclosure or add the reviewer.",
      );
    }
    if (
      disclosure.status === "disclosed" &&
      (!text(disclosure.details) || typeof disclosure.recused !== "boolean")
    ) {
      error(
        errors,
        "incomplete_conflict_disclosure",
        `conflictDisclosures[${String(index)}]`,
        "disclosed conflicts require details and recusal status",
        "Publish the conflict and whether the reviewer recused.",
      );
    }
  });
  participantIds.forEach((id) => {
    if (!disclosureIds.has(id)) {
      error(
        errors,
        "missing_conflict_disclosure",
        "conflictDisclosures",
        `must include reviewer ${id}`,
        "Publish either a no-conflict declaration or disclosed conflict details.",
      );
    }
  });
}

/**
 * Validates a Maintainer nomination against the eligibility criteria, review
 * window, decision deadline, and appeal window published by the Governance
 * Model's `maintainerSelection` rules (Requirement 16.9).
 */
export function validateMaintainerNomination(
  eligibilityCriteria: string[],
  timing: MaintainerEligibilityCriteria,
  nomination: MaintainerNomination,
): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, nomination.id, "id");
  requireText(errors, nomination.nomineeId, "nomineeId");
  const submittedValid = validateDate(errors, nomination.submittedAt, "submittedAt");
  if (
    !list(nomination.eligibilityEvidence) ||
    nomination.eligibilityEvidence.length < eligibilityCriteria.length
  ) {
    error(
      errors,
      "incomplete_eligibility_evidence",
      "eligibilityEvidence",
      `must publish evidence for every published eligibility criterion (${String(eligibilityCriteria.length)})`,
      "Publish evidence addressing each eligibility criterion.",
    );
  } else {
    nomination.eligibilityEvidence.forEach((evidence, index) => {
      requireText(errors, evidence, `eligibilityEvidence[${String(index)}]`);
    });
  }

  if (!nomination.schedule) {
    if (nomination.status !== "nominated") {
      error(
        errors,
        "schedule_required",
        "schedule",
        "review requires a published review start, review deadline, and decision deadline",
        "Publish the calendar schedule for review.",
      );
    }
    return { valid: errors.length === 0, errors };
  }
  const reviewStartValid = validateDate(
    errors,
    nomination.schedule.reviewStart,
    "schedule.reviewStart",
  );
  const reviewDeadlineValid = validateDate(
    errors,
    nomination.schedule.reviewDeadline,
    "schedule.reviewDeadline",
  );
  const decisionDeadlineValid = validateDate(
    errors,
    nomination.schedule.decisionDeadline,
    "schedule.decisionDeadline",
  );
  if (
    reviewStartValid &&
    submittedValid &&
    nomination.schedule.reviewStart < nomination.submittedAt
  ) {
    error(
      errors,
      "review_before_submission",
      "schedule.reviewStart",
      "must not be earlier than the submission date",
      "Start review on or after the nomination submission date.",
    );
  }
  if (reviewStartValid && reviewDeadlineValid) {
    const expectedReviewDeadline = addCalendarDays(
      nomination.schedule.reviewStart,
      timing.reviewWindow.value,
    );
    if (nomination.schedule.reviewDeadline !== expectedReviewDeadline) {
      error(
        errors,
        "incorrect_review_deadline",
        "schedule.reviewDeadline",
        `must equal ${expectedReviewDeadline}`,
        "Calculate the deadline using the published calendar-day review window.",
      );
    }
  }
  if (reviewDeadlineValid && decisionDeadlineValid) {
    const expectedDecisionDeadline = addCalendarDays(
      nomination.schedule.reviewDeadline,
      timing.decisionDeadline.value,
    );
    if (nomination.schedule.decisionDeadline !== expectedDecisionDeadline) {
      error(
        errors,
        "incorrect_decision_deadline",
        "schedule.decisionDeadline",
        `must equal ${expectedDecisionDeadline}`,
        "Calculate the deadline from the review deadline using the published calendar-day decision window.",
      );
    }
  }

  validateNominationParticipants(errors, nomination.reviewers, nomination.conflictDisclosures);

  if (nomination.decision) {
    requireText(errors, nomination.decision.rationale, "decision.rationale");
    validateDate(errors, nomination.decision.decisionDate, "decision.decisionDate");
    requireText(errors, nomination.decision.authorityId, "decision.authorityId");
    if (nomination.status !== "decided" && nomination.status !== "appealed") {
      error(
        errors,
        "final_status_required",
        "status",
        "must reflect the published nomination decision",
        "Set status to decided or appealed.",
      );
    }
    if (nomination.appeal) {
      const filedValid = validateDate(errors, nomination.appeal.filedAt, "appeal.filedAt");
      requireText(errors, nomination.appeal.rationale, "appeal.rationale");
      if (filedValid) {
        const appealDeadline = addCalendarDays(
          nomination.decision.decisionDate,
          timing.appealWindow.value,
        );
        if (nomination.appeal.filedAt > appealDeadline) {
          error(
            errors,
            "appeal_window_expired",
            "appeal.filedAt",
            `must not be later than ${appealDeadline}`,
            "File the appeal within the published appeal window.",
          );
        }
      }
      validateOptionalDate(errors, nomination.appeal.decidedAt, "appeal.decidedAt");
    }
  } else if (nomination.status === "decided" || nomination.status === "appealed") {
    error(
      errors,
      "decision_record_required",
      "decision",
      "final status requires outcome, rationale, decision-makers, authority, and date",
      "Publish the final nomination decision record.",
    );
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 16.12: Public participation workflows
// ---------------------------------------------------------------------------

export interface PublicParticipationWorkflows {
  schemaVersion: string;
  issuesPath: PublicProcessLink;
  discussionsPath: PublicProcessLink;
  proposalsPath: PublicProcessLink;
  changeReviewPath: PublicProcessLink;
}

const PARTICIPATION_WORKFLOW_LINK_FIELDS = [
  "issuesPath",
  "discussionsPath",
  "proposalsPath",
  "changeReviewPath",
] as const satisfies readonly (keyof PublicParticipationWorkflows)[];

export function validatePublicParticipationWorkflows(
  workflows: PublicParticipationWorkflows,
): PolicyValidation {
  const errors: FieldError[] = [];
  requireText(errors, workflows.schemaVersion, "schemaVersion");
  PARTICIPATION_WORKFLOW_LINK_FIELDS.forEach((field) => {
    validatePublicLink(errors, workflows[field], field);
  });
  return { valid: errors.length === 0, errors };
}

export function renderPublicParticipationWorkflows(
  workflows: PublicParticipationWorkflows,
): PublicParticipationWorkflows {
  return {
    schemaVersion: workflows.schemaVersion,
    ...allowlist(workflows, PARTICIPATION_WORKFLOW_LINK_FIELDS),
  };
}
