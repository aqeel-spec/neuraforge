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
  // Navigation
  navbar: ["src/navigation-layout/navbar.tsx"],
  sidebar: ["src/navigation-layout/sidebar.tsx"],
  breadcrumbs: ["src/navigation-layout/breadcrumbs.tsx"],
  tabs: ["src/navigation-layout/tabs.tsx"],
  dock: ["src/navigation-layout/dock.tsx"],
  "context-menu": ["src/navigation-layout/context-menu.tsx"],
  // Layout
  footer: ["src/navigation-layout/footer.tsx"],
  card: ["src/navigation-layout/card.tsx"],
  hero: ["src/navigation-layout/hero.tsx"],
  sticky: ["src/navigation-layout/sticky.tsx"],
  bento: ["src/navigation-layout/bento.tsx"],
  marquee: ["src/navigation-layout/marquee.tsx"],
  "parallax-section": ["src/navigation-layout/parallax-section.tsx"],
  resizable: ["src/navigation-layout/resizable.tsx"],
  // Forms
  form: ["src/forms/form.tsx"],
  "text-field": ["src/forms/text-field.tsx"],
  "phone-input": ["src/forms/phone-input.tsx"],
  "search-input": ["src/forms/search-input.tsx"],
  "tag-input": ["src/forms/tag-input.tsx"],
  "star-rating": ["src/forms/star-rating.tsx"],
  "signature-pad": ["src/forms/signature-pad.tsx"],
  // Feedback
  alert: ["src/feedback/alert.tsx"],
  dialog: ["src/feedback/dialog.tsx"],
  "loading-indicator": ["src/feedback/loading-indicator.tsx"],
  toast: ["src/feedback/toast.tsx"],
  banner: ["src/feedback/banner.tsx"],
  "notification-center": ["src/feedback/notification-center.tsx"],
  "inline-alert": ["src/feedback/inline-alert.tsx"],
  spotlight: ["src/feedback/spotlight.tsx"],
  confetti: ["src/feedback/confetti.tsx"],
  // Data Display
  "data-table": ["src/data-display.tsx"],
  stat: ["src/data-display.tsx"],
  badge: ["src/data-display.tsx"],
  avatar: ["src/data-display.tsx"],
  chart: ["src/data-display/chart.tsx"],
  "code-block": ["src/data-display/code-block.tsx"],
  "copy-button": ["src/data-display/copy-button.tsx"],
  "count-up": ["src/data-display/count-up.tsx"],
  list: ["src/data-display/list.tsx"],
  "tree-view": ["src/navigation-layout/tree-view.tsx"],
  kanban: ["src/navigation-layout/kanban.tsx"],
  "infinite-scroll": ["src/navigation-layout/infinite-scroll.tsx"],
  "virtual-list": ["src/navigation-layout/virtual-list.tsx"],
  // Marketing
  "call-to-action": ["src/marketing.tsx"],
  pricing: ["src/marketing.tsx"],
  faq: ["src/marketing.tsx"],
  "logo-cloud": ["src/marketing/logo-cloud.tsx"],
  newsletter: ["src/marketing/newsletter.tsx"],
  "social-proof": ["src/marketing/social-proof.tsx"],
  "comparison-table": ["src/marketing/comparison-table.tsx"],
  "hero-with-video": ["src/marketing/hero-with-video.tsx"],
  "team-grid": ["src/marketing/team-grid.tsx"],
  "stats-section": ["src/marketing/stats-section.tsx"],
  "announcement-bar": ["src/marketing/announcement-bar.tsx"],
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
