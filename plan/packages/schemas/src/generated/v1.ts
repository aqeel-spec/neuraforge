/**
 * Generated from schemas/v1/common.schema.json.
 * Do not edit directly; run npm run schemas:generate.
 */
/* eslint-disable @typescript-eslint/array-type, @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions */

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | Array<JsonValue>
  | { [key: string]: JsonValue };

export type SemanticVersion = string;

export type ArtifactKind =
  | "component"
  | "token-set"
  | "motion-preset"
  | "animated-component"
  | "three-d-component"
  | "composition";

export type AccessClassification = {
  visibility: "public";
  entitlement: "none";
  paymentRequired: false;
  licenseKeyRequired: false;
  privateVariant: false;
  paidOnlyVariant: false;
};

export type ArtifactRef = {
  kind: ArtifactKind;
  stableId: string;
  version: SemanticVersion;
};

export type Checksum = {
  algorithm: "sha256";
  canonicalization: "neuraforge-canonical-v1";
  digest: string;
};

export type FileRecord = {
  path: string;
  origin: "original" | "generated";
  mediaType: string;
  size: number;
  checksum: Checksum;
};

export type LicenseProvenance = {
  name: string;
  version: string;
  source: string;
  copyright: string;
  spdxIdentifier: string;
  licenseTextPath: string;
  attribution: string;
  redistributionObligations: Array<string>;
  reviewStatus: "pending" | "approved" | "rejected";
};

export type DependencyInventoryItem = {
  name: string;
  version: string;
  relationship: "direct" | "transitive";
  materialType: "dependency" | "asset" | "font" | "example";
  source: string;
  checksum: Checksum;
  provenance: LicenseProvenance;
};

export type CompatibilityConstraint = {
  targetType: "runtime" | "framework" | "tool" | "browser" | "operating-system" | "public-surface";
  name: string;
  version: string;
  status: "compatible" | "incompatible";
  evidenceRef?: string;
};

export type CompatibilityMatrixEntry = {
  browser: string;
  browserVersion: string;
  operatingEnvironment: string;
  publicSurface: string;
  result: "passed" | "failed" | "not-applicable";
  testedAt: string;
  evidenceRef?: string;
};

export type BuildInstruction = {
  capability: "registry" | "public-api" | "mcp-server" | "documentation-site";
  sourceLocation: string;
  command: string;
};

export type ArtifactReleaseEntry = {
  ref: ArtifactRef;
  checksum: Checksum;
  access: AccessClassification;
};

export type QualityEnvironment = {
  operatingSystem: string;
  runtime: string;
  tools: { [key: string]: string };
  prerequisites: Array<string>;
  fixtures: Array<string>;
};

export type QualityEvidenceReference = {
  uri: string;
  checksum: Checksum;
};

export type QualityGateResult = {
  checkId: string;
  checkType:
    | "formatting"
    | "static-analysis"
    | "unit"
    | "integration"
    | "property"
    | "accessibility"
    | "security"
    | "package"
    | "documentation"
    | "compatibility"
    | "license"
    | "provenance"
    | "bundle-size"
    | "runtime-performance";
  scope: string;
  required: boolean;
  status: "passed" | "failed" | "unavailable" | "malformed";
  command: string;
  environment: QualityEnvironment;
  evidence: QualityEvidenceReference;
  recordedAt: string;
  exceptionRef?: string;
};

export type PerformanceRecord = {
  artifact: ArtifactRef;
  metric: string;
  scenario: string;
  environment: QualityEnvironment;
  result: number;
  threshold: number;
  unit: string;
  command: string;
  status: "passed" | "failed";
};

export type ReleaseApproval = {
  approvedBy: string;
  approvedAt: string;
};

export type ReleaseManifest = {
  schemaVersion: "1.0.0";
  releaseVersion: SemanticVersion;
  status: "candidate" | "rejected" | "experimental" | "approved" | "stable" | "published";
  registryVersion: SemanticVersion;
  licenseTextPath: string;
  copyrightNotices: Array<string>;
  thirdPartyNoticesPath: string;
  buildInstructions: Array<BuildInstruction>;
  artifacts: Array<ArtifactReleaseEntry>;
  productionInventory: Array<DependencyInventoryItem>;
  qualityEvidenceRefs: Array<string>;
  compatibilityMatrix: Array<CompatibilityMatrixEntry>;
  approval?: ReleaseApproval;
  publishedAt?: string;
};

export type FieldError = {
  code: string;
  path: string;
  constraint: string;
  guidance: string;
};

export type ErrorResource = {
  kind: string;
  id?: string;
  version?: string;
  source?: string;
};

export type OperationError = {
  code: string;
  category:
    | "validation"
    | "not_found"
    | "conflict"
    | "integrity"
    | "availability"
    | "quota"
    | "subscription"
    | "partial_result"
    | "policy"
    | "internal";
  operation?: string;
  message: string;
  retryable: boolean;
  fields?: Array<FieldError>;
  resource?: ErrorResource;
  alternatives?: Array<ArtifactRef>;
  details?: { [key: string]: JsonValue };
  requestId: string;
};

export type ErrorEnvelope = {
  error: OperationError;
};

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = ErrorEnvelope> = Ok<T> | Err<E>;
