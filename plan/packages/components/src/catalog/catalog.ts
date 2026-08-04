import { computeFileSetChecksum } from "@neuraforge-ui/catalog-core";
import type { ComponentRecord } from "../contracts/types.js";
import { buildFileRecord } from "./builders.js";
import { createNavigationRecords } from "./records-navigation.js";
import { createLayoutRecords } from "./records-layout.js";
import { createFormsRecords } from "./records-forms.js";
import { createFeedbackRecords } from "./records-feedback.js";
import { createDataDisplayRecords } from "./records-data-display.js";
import { createMarketingRecords } from "./records-marketing.js";

// Exact source paths for each stable component. Some components intentionally share a source
// module; in that case their artifact checksum is identical because the editable source bytes
// installed for either component are identical.
const COMPONENT_SOURCE_PATHS: Readonly<Record<string, readonly string[]>> = {
  navbar: ["src/navigation-layout/navbar.tsx"],
  sidebar: ["src/navigation-layout/sidebar.tsx"],
  breadcrumbs: ["src/navigation-layout/breadcrumbs.tsx"],
  tabs: ["src/navigation-layout/tabs.tsx"],
  footer: ["src/navigation-layout/footer.tsx"],
  card: ["src/navigation-layout/card.tsx"],
  hero: ["src/navigation-layout/hero.tsx"],
  form: ["src/forms/form.tsx"],
  "text-field": ["src/forms/text-field.tsx"],
  alert: ["src/feedback/alert.tsx"],
  dialog: ["src/feedback/dialog.tsx"],
  "loading-indicator": ["src/feedback/loading-indicator.tsx"],
  toast: ["src/feedback/toast.tsx"],
  "data-table": ["src/data-display.tsx"],
  stat: ["src/data-display.tsx"],
  badge: ["src/data-display.tsx"],
  avatar: ["src/data-display.tsx"],
  "call-to-action": ["src/marketing.tsx"],
  pricing: ["src/marketing.tsx"],
  faq: ["src/marketing.tsx"],
};

async function readPublishedSource(path: string): Promise<string> {
  // Catalog construction is a release-build concern, not component render-time behavior. Keep
  // Node's filesystem module behind a dynamic import so importing React component exports does
  // not eagerly load a Node-only module in browser tooling.
  const { readFile } = await import("node:fs/promises");
  const relativeToCatalog = path.startsWith("src/") ? `../${path.slice(4)}` : path;
  return readFile(new URL(relativeToCatalog, import.meta.url), "utf8");
}

async function buildFilesForComponent(stableId: string) {
  const paths = COMPONENT_SOURCE_PATHS[stableId];
  if (!paths) throw new Error(`No source definition for ${stableId}`);

  const sources = await Promise.all(
    paths.map(async (path) => ({ path, content: await readPublishedSource(path) })),
  );
  const sourceFiles = await Promise.all(
    sources.map(({ path, content }) => buildFileRecord(path, content)),
  );
  const checksum = await computeFileSetChecksum(sources);
  return { sourceFiles, checksum };
}

/**
 * Builds the complete 20-component MVP catalog with real SHA-256 checksums.
 * Async because checksum computation uses Web Crypto.
 * Returns records sorted by stableId for deterministic ordering.
 */
export async function buildMvpCatalog(): Promise<readonly ComponentRecord[]> {
  const [
    navbarFiles,
    sidebarFiles,
    breadcrumbsFiles,
    tabsFiles,
    footerFiles,
    cardFiles,
    heroFiles,
    formFiles,
    textFieldFiles,
    alertFiles,
    dialogFiles,
    loadingIndicatorFiles,
    toastFiles,
    dataTableFiles,
    statFiles,
    badgeFiles,
    avatarFiles,
    callToActionFiles,
    pricingFiles,
    faqFiles,
  ] = await Promise.all([
    buildFilesForComponent("navbar"),
    buildFilesForComponent("sidebar"),
    buildFilesForComponent("breadcrumbs"),
    buildFilesForComponent("tabs"),
    buildFilesForComponent("footer"),
    buildFilesForComponent("card"),
    buildFilesForComponent("hero"),
    buildFilesForComponent("form"),
    buildFilesForComponent("text-field"),
    buildFilesForComponent("alert"),
    buildFilesForComponent("dialog"),
    buildFilesForComponent("loading-indicator"),
    buildFilesForComponent("toast"),
    buildFilesForComponent("data-table"),
    buildFilesForComponent("stat"),
    buildFilesForComponent("badge"),
    buildFilesForComponent("avatar"),
    buildFilesForComponent("call-to-action"),
    buildFilesForComponent("pricing"),
    buildFilesForComponent("faq"),
  ]);

  const navigation = createNavigationRecords({
    navbar: navbarFiles,
    sidebar: sidebarFiles,
    breadcrumbs: breadcrumbsFiles,
    tabs: tabsFiles,
  });

  const layout = createLayoutRecords({
    footer: footerFiles,
    card: cardFiles,
    hero: heroFiles,
  });

  const forms = createFormsRecords({
    form: formFiles,
    textField: textFieldFiles,
  });

  const feedback = createFeedbackRecords({
    alert: alertFiles,
    dialog: dialogFiles,
    loadingIndicator: loadingIndicatorFiles,
    toast: toastFiles,
  });

  const dataDisplay = createDataDisplayRecords({
    dataTable: dataTableFiles,
    stat: statFiles,
    badge: badgeFiles,
    avatar: avatarFiles,
  });

  const marketing = createMarketingRecords({
    callToAction: callToActionFiles,
    pricing: pricingFiles,
    faq: faqFiles,
  });

  const allRecords = [
    ...navigation,
    ...layout,
    ...forms,
    ...feedback,
    ...dataDisplay,
    ...marketing,
  ];

  // Sort by stableId for deterministic ordering
  allRecords.sort((a, b) => a.ref.stableId.localeCompare(b.ref.stableId));

  return Object.freeze(allRecords);
}

/**
 * Returns the stable component catalog with deterministic stableId ordering.
 * Cached after first call to provide immutable shared reference.
 */
let cachedCatalog: readonly ComponentRecord[] | undefined;

export async function getStableComponentCatalog(): Promise<readonly ComponentRecord[]> {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = await buildMvpCatalog();
  return cachedCatalog;
}

/** Resets the cached catalog (for testing only). */
export function resetCatalogCache(): void {
  cachedCatalog = undefined;
}
