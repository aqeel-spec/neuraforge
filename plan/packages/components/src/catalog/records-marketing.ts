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
import type { FileRecord, Checksum } from "@neuraforge-ui/schemas";

export function createMarketingRecords(files: {
  callToAction: { sourceFiles: FileRecord[]; checksum: Checksum };
  pricing: { sourceFiles: FileRecord[]; checksum: Checksum };
  faq: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const callToAction: ComponentRecord = {
    ref: { kind: "component", stableId: "call-to-action", version: "1.0.0" },
    status: "stable",
    category: "marketing",
    sourceFiles: files.callToAction.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("call-to-action"),
    checksum: files.callToAction.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("marketing", "call-to-action"),
    props: [
      { name: "title", type: "string", required: true, description: "CTA heading" },
      { name: "description", type: "node", required: true, description: "CTA description" },
      { name: "primaryAction", type: "object", required: true, description: "Primary action link" },
      {
        name: "secondaryAction",
        type: "object",
        required: false,
        description: "Optional secondary action link",
      },
      { name: "eyebrow", type: "string", required: false, description: "Small text above heading" },
    ],
    supportedStates: [{ name: "default", description: "CTA section with actions" }],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates to action links; Enter activates"),
        pointer: supported("Click activates action links"),
        focus: supported("Visible focus outline on action links"),
      },
      notApplicable("CTA has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: {
      requiresOptionalCapability: true,
      capability: "backdrop-filter",
      detection: capabilityDetectors["backdrop-filter"],
      fallback: {
        description: "Falls back to solid background when backdrop-filter is unavailable",
        preservesContent: true,
        preservesPrimaryActions: true,
      },
    },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "cta-basic",
        title: "Basic CTA",
        description: "A call to action section",
        props: {
          title: "Get Started",
          description: "Try it now",
          primaryAction: { label: "Sign Up", href: "/signup" },
        },
        sourcePath: "examples/cta-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("call-to-action", 1.3, 2)],
  };

  const pricing: ComponentRecord = {
    ref: { kind: "component", stableId: "pricing", version: "1.0.0" },
    status: "stable",
    category: "marketing",
    sourceFiles: files.pricing.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("pricing"),
    checksum: files.pricing.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("marketing", "pricing"),
    props: [
      { name: "title", type: "string", required: true, description: "Section heading" },
      { name: "description", type: "string", required: false, description: "Section description" },
      { name: "plans", type: "array", required: true, description: "Pricing plan cards" },
    ],
    supportedStates: [{ name: "default", description: "Pricing grid with plan cards" }],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates to plan action links; Enter activates"),
        pointer: supported("Click activates plan action links"),
        focus: supported("Visible focus outline on plan action links"),
      },
      notApplicable("Pricing has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "pricing-basic",
        title: "Basic Pricing",
        description: "A pricing section",
        props: { title: "Plans", plans: [] },
        sourcePath: "examples/pricing-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(3)],
    performanceRecords: [bundleSizeRecord("pricing", 2.2, 3)],
  };

  const faq: ComponentRecord = {
    ref: { kind: "component", stableId: "faq", version: "1.0.0" },
    status: "stable",
    category: "marketing",
    sourceFiles: files.faq.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("faq"),
    checksum: files.faq.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("marketing", "faq"),
    props: [
      { name: "title", type: "string", required: true, description: "Section heading" },
      {
        name: "items",
        type: "array",
        required: true,
        description: "FAQ items with question and answer",
      },
    ],
    supportedStates: [
      { name: "all-collapsed", description: "All FAQ items are collapsed" },
      { name: "item-expanded", description: "One or more FAQ items are expanded" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported(
          "Enter/Space toggles FAQ item open/closed; Tab navigates between summaries",
        ),
        pointer: supported("Click toggles FAQ item open/closed"),
        focus: supported("Visible focus outline on summary elements"),
      },
      notApplicable("FAQ has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "faq-basic",
        title: "Basic FAQ",
        description: "An FAQ section",
        props: { title: "FAQ", items: [] },
        sourcePath: "examples/faq-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("faq", 1.1, 2)],
  };

  return [callToAction, pricing, faq];
}
