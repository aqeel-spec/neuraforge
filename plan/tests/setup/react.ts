import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

/**
 * React Testing Library only auto-registers its `afterEach(cleanup)` hook when Vitest runs
 * with `globals: true`. This workspace deliberately keeps globals off so every test imports
 * its helpers explicitly, so the hook is registered here instead.
 *
 * Without it, each `render` call appends a new container to `document.body` that is never
 * removed, so role queries in later tests in the same file match elements left behind by
 * earlier tests and fail with "Found multiple elements".
 *
 * The import is dynamic and DOM-guarded because this setup file also runs for the
 * node-environment suites, which never render and have no `document`.
 */
afterEach(async () => {
  if (typeof document === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
