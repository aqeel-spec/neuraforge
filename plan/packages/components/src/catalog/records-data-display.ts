import type { ComponentRecord } from "../contracts/types.js";
import {
  behaviorMap,
  noExternalPrimitive,
  notApplicable,
  supported,
} from "../contracts/builders.js";
import { capabilityDetectors } from "../contracts/capabilities.js";
import {
  bundleSizeBudget,
  bundleSizeRecord,
  docPath,
  MIT_PROVENANCE,
  STANDARD_COMPATIBILITY,
  STANDARD_DEPS,
  STANDARD_PEER_DEPS,
  standardInstall,
} from "./builders.js";
import type { FileRecord, Checksum } from "@neuraforge/schemas";

export function createDataDisplayRecords(files: {
  dataTable: { sourceFiles: FileRecord[]; checksum: Checksum };
  stat: { sourceFiles: FileRecord[]; checksum: Checksum };
  badge: { sourceFiles: FileRecord[]; checksum: Checksum };
  avatar: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const dataTable: ComponentRecord = {
    ref: { kind: "component", stableId: "data-table", version: "1.0.0" },
    status: "stable",
    category: "data-display",
    sourceFiles: files.dataTable.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("data-table"),
    checksum: files.dataTable.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("data-display", "data-table"),
    props: [
      {
        name: "caption",
        type: "string",
        required: true,
        description: "Accessible table caption (sr-only)",
      },
      {
        name: "columns",
        type: "array",
        required: true,
        description: "Column definitions with key, header, cell renderer",
      },
      { name: "rows", type: "array", required: true, description: "Data rows" },
      {
        name: "getRowKey",
        type: "function",
        required: true,
        description: "Returns unique key for each row",
      },
      {
        name: "emptyMessage",
        type: "string",
        required: false,
        description: "Message when no rows",
        defaultValue: "No data available.",
      },
    ],
    supportedStates: [
      { name: "populated", description: "Table has rows of data" },
      { name: "empty", description: "Table has no rows; shows empty message" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Standard table navigation; Tab reaches interactive cells"),
        pointer: supported("Standard pointer interaction with table content"),
        focus: supported("Focus indicators on interactive elements within cells"),
      },
      notApplicable("DataTable has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: {
      requiresOptionalCapability: true,
      capability: "container-queries",
      detection: capabilityDetectors["container-queries"],
      fallback: {
        description:
          "Horizontal scroll wrapper preserves content when container queries unavailable",
        preservesContent: true,
        preservesPrimaryActions: true,
      },
    },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "data-table-basic",
        title: "Basic DataTable",
        description: "A table with rows",
        props: { caption: "Users", columns: [], rows: [] },
        sourcePath: "examples/data-table-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(3)],
    performanceRecords: [bundleSizeRecord("data-table", 2.0, 3)],
  };

  const stat: ComponentRecord = {
    ref: { kind: "component", stableId: "stat", version: "1.0.0" },
    status: "stable",
    category: "data-display",
    sourceFiles: files.stat.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("stat"),
    checksum: files.stat.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("data-display", "stat"),
    props: [
      { name: "label", type: "string", required: true, description: "Stat metric label" },
      { name: "value", type: "node", required: true, description: "The primary stat value" },
      { name: "description", type: "node", required: false, description: "Supporting context" },
      {
        name: "trend",
        type: "object",
        required: false,
        description: "Trend indicator with direction and label",
      },
    ],
    supportedStates: [
      { name: "default", description: "Stat card with value" },
      { name: "with-trend", description: "Stat with directional trend indicator" },
    ],
    behavior: behaviorMap(
      {},
      notApplicable("Stat is a presentational component with no interactive behavior"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "stat-basic",
        title: "Basic Stat",
        description: "A stat card",
        props: { label: "Revenue", value: "$42k" },
        sourcePath: "examples/stat-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1)],
    performanceRecords: [bundleSizeRecord("stat", 0.6, 1)],
  };

  const badge: ComponentRecord = {
    ref: { kind: "component", stableId: "badge", version: "1.0.0" },
    status: "stable",
    category: "data-display",
    sourceFiles: files.badge.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("badge"),
    checksum: files.badge.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("data-display", "badge"),
    props: [
      { name: "children", type: "node", required: true, description: "Badge text content" },
      {
        name: "tone",
        type: "enum",
        required: false,
        description: "Visual tone",
        allowedValues: ["neutral", "brand", "success", "warning", "danger"],
        defaultValue: "neutral",
      },
    ],
    supportedStates: [{ name: "default", description: "Badge rendered with text and tone" }],
    behavior: behaviorMap(
      {},
      notApplicable("Badge is a presentational label with no interactive behavior"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "badge-basic",
        title: "Basic Badge",
        description: "A status badge",
        props: { children: "Active", tone: "success" },
        sourcePath: "examples/badge-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(0.5)],
    performanceRecords: [bundleSizeRecord("badge", 0.3, 0.5)],
  };

  const avatar: ComponentRecord = {
    ref: { kind: "component", stableId: "avatar", version: "1.0.0" },
    status: "stable",
    category: "data-display",
    sourceFiles: files.avatar.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("avatar"),
    checksum: files.avatar.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("data-display", "avatar"),
    props: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Person's name (used for initials fallback and accessible name)",
      },
      { name: "src", type: "string", required: false, description: "Image URL" },
      { name: "alt", type: "string", required: false, description: "Custom alt text for image" },
      {
        name: "size",
        type: "enum",
        required: false,
        description: "Avatar size",
        allowedValues: ["sm", "md", "lg"],
        defaultValue: "md",
      },
    ],
    supportedStates: [
      { name: "image", description: "Avatar shows the provided image" },
      { name: "initials", description: "Image unavailable; shows initials" },
    ],
    behavior: behaviorMap(
      {},
      notApplicable("Avatar is a presentational component with no interactive behavior"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "avatar-basic",
        title: "Basic Avatar",
        description: "An avatar with name",
        props: { name: "Ada Lovelace" },
        sourcePath: "examples/avatar-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1)],
    performanceRecords: [bundleSizeRecord("avatar", 0.7, 1)],
  };

  return [dataTable, stat, badge, avatar];
}
