import type { ComponentRecord } from "../contracts/types.js";
import {
  behaviorMap,
  noExternalPrimitive,
  notApplicable,
  supported,
} from "../contracts/builders.js";
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

export function createLayoutRecords(files: {
  footer: { sourceFiles: FileRecord[]; checksum: Checksum };
  card: { sourceFiles: FileRecord[]; checksum: Checksum };
  hero: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const footer: ComponentRecord = {
    ref: { kind: "component", stableId: "footer", version: "1.0.0" },
    status: "stable",
    category: "layout",
    sourceFiles: files.footer.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("footer"),
    checksum: files.footer.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("layout", "footer"),
    props: [
      { name: "brand", type: "node", required: true, description: "Brand logo or name" },
      {
        name: "description",
        type: "node",
        required: false,
        description: "Short brand description",
      },
      { name: "sections", type: "array", required: false, description: "Footer link sections" },
      { name: "legal", type: "node", required: false, description: "Legal notice content" },
    ],
    supportedStates: [
      { name: "default", description: "Footer with brand, sections, and optional legal" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates between footer links; Enter activates"),
        pointer: supported("Click navigates footer links"),
        focus: supported("Visible focus ring on all footer links"),
      },
      notApplicable("Footer is a static landmark with no dynamic states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "footer-basic",
        title: "Basic Footer",
        description: "A site footer with brand and link sections",
        props: { brand: "Acme" },
        sourcePath: "examples/footer-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("footer", 1.4, 2)],
  };

  const card: ComponentRecord = {
    ref: { kind: "component", stableId: "card", version: "1.0.0" },
    status: "stable",
    category: "layout",
    sourceFiles: files.card.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("card"),
    checksum: files.card.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("layout", "card"),
    props: [
      { name: "title", type: "node", required: true, description: "Card heading content" },
      { name: "description", type: "node", required: false, description: "Card body text" },
      {
        name: "media",
        type: "node",
        required: false,
        description: "Optional media slot (image, video)",
      },
      { name: "footer", type: "node", required: false, description: "Optional footer content" },
      {
        name: "href",
        type: "string",
        required: false,
        description: "Makes the card a clickable link",
      },
    ],
    supportedStates: [
      { name: "default", description: "Card displayed with content" },
      { name: "linked", description: "Card is clickable (href provided)" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported(
          "When linked, Enter/Space activates the card link; Tab reaches the link",
        ),
        pointer: supported("Click on linked card navigates to href"),
        focus: supported("Visible focus ring on the card link element"),
      },
      notApplicable("Card has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "card-basic",
        title: "Basic Card",
        description: "A content card",
        props: { title: "Hello" },
        sourcePath: "examples/card-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1.5)],
    performanceRecords: [bundleSizeRecord("card", 0.8, 1.5)],
  };

  const hero: ComponentRecord = {
    ref: { kind: "component", stableId: "hero", version: "1.0.0" },
    status: "stable",
    category: "layout",
    sourceFiles: files.hero.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("hero"),
    checksum: files.hero.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("layout", "hero"),
    props: [
      { name: "title", type: "node", required: true, description: "Hero heading content" },
      { name: "description", type: "node", required: true, description: "Hero description text" },
      {
        name: "eyebrow",
        type: "node",
        required: false,
        description: "Small text above the heading",
      },
      { name: "actions", type: "node", required: false, description: "CTA buttons" },
      {
        name: "visual",
        type: "node",
        required: false,
        description: "Optional visual/illustration panel",
      },
      {
        name: "align",
        type: "enum",
        required: false,
        description: "Content alignment",
        allowedValues: ["left", "center"],
        defaultValue: "left",
      },
    ],
    supportedStates: [
      { name: "default", description: "Hero section with heading and description" },
      { name: "with-visual", description: "Hero with a two-column layout including visual" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates to action links/buttons within the hero"),
        pointer: supported("Click activates action links/buttons"),
        focus: supported("Visible focus ring on interactive elements within hero"),
      },
      notApplicable("Hero is a presentational section with no dynamic states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "hero-basic",
        title: "Basic Hero",
        description: "A hero section",
        props: { title: "Welcome", description: "Get started" },
        sourcePath: "examples/hero-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("hero", 1.1, 2)],
  };

  return [footer, card, hero];
}
