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
import type { FileRecord, Checksum } from "@neuraforge/schemas";

/**
 * Creates navigation category component records.
 * Accepts pre-computed file records and checksums for real integrity.
 */
export function createNavigationRecords(files: {
  navbar: { sourceFiles: FileRecord[]; checksum: Checksum };
  sidebar: { sourceFiles: FileRecord[]; checksum: Checksum };
  breadcrumbs: { sourceFiles: FileRecord[]; checksum: Checksum };
  tabs: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const navbar: ComponentRecord = {
    ref: { kind: "component", stableId: "navbar", version: "1.0.0" },
    status: "stable",
    category: "navigation",
    sourceFiles: files.navbar.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("navbar"),
    checksum: files.navbar.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("navigation", "navbar"),
    props: [
      {
        name: "brand",
        type: "node",
        required: true,
        description: "Brand logo or name displayed at the start of the navbar",
      },
      {
        name: "items",
        type: "array",
        required: true,
        description: "Navigation items rendered as links",
      },
      {
        name: "actions",
        type: "node",
        required: false,
        description: "Optional action elements (buttons, avatars) on the right",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible label for the nav landmark",
        defaultValue: "Main navigation",
      },
    ],
    supportedStates: [
      { name: "default", description: "Desktop layout with visible links" },
      { name: "mobile-open", description: "Mobile menu panel is expanded" },
      { name: "mobile-closed", description: "Mobile menu panel is collapsed" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported(
          "Enter/Space toggles mobile menu; Escape closes it; Tab navigates links",
        ),
        pointer: supported("Click toggles mobile menu; click navigates links"),
        focus: supported(
          "Visible focus ring on all interactive elements; focus moves into panel on open",
        ),
        disabled: supported("Disabled items render aria-disabled and are not focusable"),
      },
      notApplicable("Navbar has no loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "navbar-basic",
        title: "Basic Navbar",
        description: "A navbar with brand and navigation items",
        props: { brand: "Acme", items: [] },
        sourcePath: "examples/navbar-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(3)],
    performanceRecords: [bundleSizeRecord("navbar", 1.8, 3)],
  };

  const sidebar: ComponentRecord = {
    ref: { kind: "component", stableId: "sidebar", version: "1.0.0" },
    status: "stable",
    category: "navigation",
    sourceFiles: files.sidebar.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("sidebar"),
    checksum: files.sidebar.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("navigation", "sidebar"),
    props: [
      {
        name: "sections",
        type: "array",
        required: true,
        description: "Sidebar sections containing navigation items",
      },
      { name: "header", type: "node", required: false, description: "Optional header content" },
      { name: "footer", type: "node", required: false, description: "Optional footer content" },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible label for the nav landmark",
        defaultValue: "Sidebar navigation",
      },
    ],
    supportedStates: [
      { name: "default", description: "Sidebar with visible navigation sections" },
      { name: "scrolled", description: "Content area is scrolled" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates between links; standard link activation with Enter"),
        pointer: supported("Click navigates to the linked page"),
        focus: supported("Visible focus ring on all interactive elements"),
        disabled: supported("Disabled items render aria-disabled and are not focusable"),
      },
      notApplicable("Sidebar has no loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "sidebar-basic",
        title: "Basic Sidebar",
        description: "A sidebar with grouped sections",
        props: { sections: [] },
        sourcePath: "examples/sidebar-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("sidebar", 1.2, 2)],
  };

  const breadcrumbs: ComponentRecord = {
    ref: { kind: "component", stableId: "breadcrumbs", version: "1.0.0" },
    status: "stable",
    category: "navigation",
    sourceFiles: files.breadcrumbs.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("breadcrumbs"),
    checksum: files.breadcrumbs.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("navigation", "breadcrumbs"),
    props: [
      {
        name: "items",
        type: "array",
        required: true,
        description: "Ordered breadcrumb items from root to current page",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible label for the nav landmark",
        defaultValue: "Breadcrumb",
      },
    ],
    supportedStates: [
      { name: "default", description: "Breadcrumb trail with links and current page indicator" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab navigates between breadcrumb links; Enter activates"),
        pointer: supported("Click navigates to the breadcrumb target"),
        focus: supported("Visible focus ring on breadcrumb links"),
      },
      notApplicable("Breadcrumbs have no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "breadcrumbs-basic",
        title: "Basic Breadcrumbs",
        description: "A breadcrumb trail",
        props: { items: [] },
        sourcePath: "examples/breadcrumbs-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1)],
    performanceRecords: [bundleSizeRecord("breadcrumbs", 0.5, 1)],
  };

  const tabs: ComponentRecord = {
    ref: { kind: "component", stableId: "tabs", version: "1.0.0" },
    status: "stable",
    category: "navigation",
    sourceFiles: files.tabs.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("tabs"),
    checksum: files.tabs.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("navigation", "tabs"),
    props: [
      {
        name: "tabs",
        type: "array",
        required: true,
        description: "Tab items with id, label, content, and optional disabled",
      },
      {
        name: "label",
        type: "string",
        required: true,
        description: "Accessible label for the tablist",
      },
      {
        name: "defaultTab",
        type: "string",
        required: false,
        description: "Initial active tab id (uncontrolled mode)",
      },
      {
        name: "selectedTab",
        type: "string",
        required: false,
        description: "Controlled active tab id",
      },
      {
        name: "onTabChange",
        type: "function",
        required: false,
        description: "Callback when active tab changes",
      },
    ],
    supportedStates: [
      { name: "default", description: "One tab is selected and its panel visible" },
      {
        name: "disabled-tab",
        description: "A tab is disabled and skipped during keyboard navigation",
      },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported(
          "ArrowLeft/Right cycles enabled tabs; Home/End jumps to first/last; disabled tabs are skipped",
        ),
        pointer: supported("Click selects an enabled tab"),
        focus: supported("Visible focus ring on tabs; activation follows focus"),
        disabled: supported(
          "Disabled tabs have aria-disabled, tabIndex=-1, and are skipped in keyboard navigation",
        ),
      },
      notApplicable("Tabs have no loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "tabs-basic",
        title: "Basic Tabs",
        description: "A tabbed interface",
        props: { tabs: [], label: "Settings" },
        sourcePath: "examples/tabs-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("tabs", 1.5, 2)],
  };

  return [navbar, sidebar, breadcrumbs, tabs];
}
