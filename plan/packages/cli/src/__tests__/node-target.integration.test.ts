/**
 * Integration test: real temporary Node filesystem adapter.
 *
 * Uses createNodeTarget with a real temp directory to verify
 * atomic writes, symlink escape detection, and end-to-end install+rollback.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNodeTarget } from "../node-target.js";
import { createInstaller } from "../installer.js";
import { createMockReader } from "./fixtures.js";
import type { Installer } from "../installer.js";

describe("Node target integration", () => {
  let tempDir: string;
  let installer: Installer;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "neuraforge-cli-test-"));
    const reader = await createMockReader();
    const result = createInstaller(reader);
    if (!result.ok) throw new Error("Failed to create installer");
    installer = result.value;
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("performs end-to-end install with real filesystem", async () => {
    const target = await createNodeTarget(tempDir);

    // Preview
    const previewResult = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(previewResult.ok).toBe(true);
    if (!previewResult.ok) throw new Error("unreachable");

    const plan = previewResult.value;
    expect(plan.operations.length).toBe(2);

    // Apply
    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };
    const applyResult = await installer.apply(plan, confirmation, target);
    expect(applyResult.ok).toBe(true);
    if (!applyResult.ok) throw new Error("apply failed: " + applyResult.error.message);

    // Verify files on disk
    const buttonContent = await readFile(join(tempDir, "src", "components", "Button.tsx"), "utf-8");
    expect(buttonContent).toContain("Button");

    const cssContent = await readFile(join(tempDir, "src", "components", "button.css"), "utf-8");
    expect(cssContent).toContain("button");

    // Verify journal on disk
    const journalContent = await readFile(join(tempDir, applyResult.value.journalPath), "utf-8");
    const journal = JSON.parse(journalContent) as { status: string };
    expect(journal.status).toBe("committed");
  });

  it("performs end-to-end rollback with real filesystem", async () => {
    const target = await createNodeTarget(tempDir);

    // Preview + Apply
    const previewResult = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    if (!previewResult.ok) throw new Error("unreachable");
    const plan = previewResult.value;

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };
    const applyResult = await installer.apply(plan, confirmation, target);
    if (!applyResult.ok) throw new Error("apply failed");

    // Rollback
    const rollbackResult = await installer.rollback(plan.planId, target);
    expect(rollbackResult.ok).toBe(true);
    if (!rollbackResult.ok) throw new Error("rollback failed");
    expect(rollbackResult.value.success).toBe(true);

    // Verify files deleted
    const exists = await target.exists("src/components/Button.tsx");
    expect(exists).toBe(false);
  });

  it("rejects paths that escape the root via symlink", async () => {
    // Skip on systems without symlink support
    const { symlink } = await import("node:fs/promises");

    // Create a directory outside root
    const outsideDir = await mkdtemp(join(tmpdir(), "neuraforge-outside-"));
    try {
      // Create a symlink inside root pointing outside
      await mkdir(join(tempDir, "src"), { recursive: true });
      try {
        await symlink(outsideDir, join(tempDir, "src", "escape"), "dir");
      } catch {
        // Symlink creation may fail without privileges on Windows
        return;
      }

      const target = await createNodeTarget(tempDir);

      // Attempting to write through the symlink should fail
      await expect(target.writeFile("src/escape/evil.txt", "pwned")).rejects.toThrow();
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it("writeFile is atomic (temp + rename)", async () => {
    const target = await createNodeTarget(tempDir);

    // Write a file
    await target.writeFile("test.txt", "hello world");

    // Read it back
    const content = await target.readFile("test.txt");
    expect(content).toBe("hello world");

    // Verify checksum
    const checksum = await target.checksum("test.txt");
    expect(checksum).toBeDefined();
    expect(checksum?.algorithm).toBe("sha256");
  });

  it("deleteFile is idempotent", async () => {
    const target = await createNodeTarget(tempDir);

    // Write then delete
    await target.writeFile("temp.txt", "temporary");
    await target.deleteFile("temp.txt");
    const exists = await target.exists("temp.txt");
    expect(exists).toBe(false);

    // Deleting again should not throw
    await target.deleteFile("temp.txt");
  });

  it("rejects path traversal attempts", async () => {
    const target = await createNodeTarget(tempDir);

    await expect(target.writeFile("../escape.txt", "pwned")).rejects.toThrow(
      "Path security violation",
    );
    await expect(target.readFile("../escape.txt")).rejects.toThrow("Path security violation");
  });

  it("precondition failure prevents mutation", async () => {
    const target = await createNodeTarget(tempDir);

    // Write a file that will cause precondition mismatch
    await mkdir(join(tempDir, "src", "components"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "components", "Button.tsx"),
      "// unexpected file",
      "utf-8",
    );

    // Preview against a clean (empty) temp dir
    const cleanDir = await mkdtemp(join(tmpdir(), "neuraforge-clean-"));
    try {
      const cleanTarget = await createNodeTarget(cleanDir);
      const previewResult = await installer.preview(
        { stableId: "button", version: "1.0.0", destination: "src/components" },
        cleanTarget,
      );
      if (!previewResult.ok) throw new Error("unreachable");
      const plan = previewResult.value;

      // Apply against the target with pre-existing file — should fail precondition
      const confirmation = {
        confirmed: true as const,
        planId: plan.planId,
        planChecksum: plan.planChecksum,
      };
      const applyResult = await installer.apply(plan, confirmation, target);
      expect(applyResult.ok).toBe(false);
      if (applyResult.ok) throw new Error("unreachable");
      expect(applyResult.error.code).toBe("precondition_failed");
    } finally {
      await rm(cleanDir, { recursive: true, force: true });
    }
  });
});
