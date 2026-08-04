/**
 * CLI command adapter tests.
 *
 * Tests: search/inspect/install --preview/install/rollback commands,
 * exit codes, structured output, no telemetry.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import { runCli } from "../cli.js";
import type { CliIO } from "../cli.js";
import { createMockReader, createMemoryMutableTarget } from "./fixtures.js";

function createTestIO(): CliIO & { stdoutData: string; stderrData: string } {
  const io = {
    stdoutData: "",
    stderrData: "",
    stdout(data: string) {
      io.stdoutData += data;
    },
    stderr(data: string) {
      io.stderrData += data;
    },
  };
  return io;
}

describe("runCli", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  describe("search command", () => {
    it("returns exit 0 with results on successful search", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["search", "button"], io, installer);
      expect(exitCode).toBe(0);
      const output = JSON.parse(io.stdoutData) as { results: unknown[] };
      expect(output.results.length).toBeGreaterThan(0);
    });

    it("returns exit 1 with error on empty query", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["search"], io, installer);
      expect(exitCode).toBe(1);
    });
  });

  describe("inspect command", () => {
    it("returns exit 0 with metadata for valid component", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["inspect", "button", "1.0.0"], io, installer);
      expect(exitCode).toBe(0);
      const output = JSON.parse(io.stdoutData) as { stableId: string };
      expect(output.stableId).toBe("button");
    });

    it("returns exit 1 for missing component", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["inspect", "nonexistent", "1.0.0"], io, installer);
      expect(exitCode).toBe(1);
      expect(io.stderrData).toContain("not_found");
    });

    it("returns exit 1 with usage on missing args", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["inspect", "button"], io, installer);
      expect(exitCode).toBe(1);
    });
  });

  describe("install --preview command", () => {
    it("returns exit 0 with plan and never mutates", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(
        ["install", "--preview", "button", "1.0.0", "--destination", "src/components"],
        io,
        installer,
        { target },
      );
      expect(exitCode).toBe(0);
      const plan = JSON.parse(io.stdoutData) as { planId: string; operations: unknown[] };
      expect(plan.planId).toBeDefined();
      expect(plan.operations.length).toBe(2);
      // Target should be empty (preview doesn't write)
      expect(Object.keys(target.files).length).toBe(0);
    });

    it("returns exit 1 for invalid component", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(
        ["install", "--preview", "nonexistent", "1.0.0", "--destination", "src/components"],
        io,
        installer,
        { target },
      );
      expect(exitCode).toBe(1);
    });
  });

  describe("install command with --yes", () => {
    it("succeeds with correct plan-id", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});

      // First preview to get planId
      const previewIo = createTestIO();
      await runCli(
        ["install", "--preview", "button", "1.0.0", "--destination", "src/components"],
        previewIo,
        installer,
        { target },
      );
      const plan = JSON.parse(previewIo.stdoutData) as { planId: string };

      const exitCode = await runCli(
        [
          "install",
          "button",
          "1.0.0",
          "--destination",
          "src/components",
          "--yes",
          "--plan-id",
          plan.planId,
        ],
        io,
        installer,
        { target },
      );
      expect(exitCode).toBe(0);
      expect(target.files["src/components/Button.tsx"]).toBeDefined();
    });

    it("fails without --plan-id when using --yes", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(
        ["install", "button", "1.0.0", "--destination", "src/components", "--yes"],
        io,
        installer,
        { target },
      );
      expect(exitCode).toBe(1);
      expect(io.stderrData).toContain("--plan-id");
    });

    it("fails with wrong plan-id", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(
        [
          "install",
          "button",
          "1.0.0",
          "--destination",
          "src/components",
          "--yes",
          "--plan-id",
          "wrong",
        ],
        io,
        installer,
        { target },
      );
      expect(exitCode).toBe(1);
      expect(io.stderrData).toContain("does not match");
    });
  });

  describe("rollback command", () => {
    it("succeeds after a successful install", async () => {
      const target = createMemoryMutableTarget({});
      const installIo = createTestIO();

      // Preview and get planId
      const previewIo = createTestIO();
      await runCli(
        ["install", "--preview", "button", "1.0.0", "--destination", "src/components"],
        previewIo,
        installer,
        { target },
      );
      const plan = JSON.parse(previewIo.stdoutData) as { planId: string };

      // Install
      await runCli(
        [
          "install",
          "button",
          "1.0.0",
          "--destination",
          "src/components",
          "--yes",
          "--plan-id",
          plan.planId,
        ],
        installIo,
        installer,
        { target },
      );

      // Rollback
      const rollbackIo = createTestIO();
      const exitCode = await runCli(["rollback", plan.planId], rollbackIo, installer, { target });
      expect(exitCode).toBe(0);
      expect(target.files["src/components/Button.tsx"]).toBeUndefined();
    });

    it("returns exit 1 for nonexistent plan", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(["rollback", "nonexistent"], io, installer, { target });
      expect(exitCode).toBe(1);
    });
  });

  describe("general", () => {
    it("returns exit 1 for unknown command", async () => {
      const io = createTestIO();
      const exitCode = await runCli(["unknown"], io, installer);
      expect(exitCode).toBe(1);
    });

    it("returns exit 1 with usage on no arguments", async () => {
      const io = createTestIO();
      const exitCode = await runCli([], io, installer);
      expect(exitCode).toBe(1);
    });

    it("requires --destination for install", async () => {
      const io = createTestIO();
      const target = createMemoryMutableTarget({});
      const exitCode = await runCli(["install", "--preview", "button", "1.0.0"], io, installer, {
        target,
      });
      expect(exitCode).toBe(1);
      expect(io.stderrData).toContain("--destination");
    });
  });
});

describe("no telemetry", () => {
  it("source files do not contain telemetry calls", async () => {
    // This is a static check — we search the source for executable telemetry patterns
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const srcDir = path.join(import.meta.dirname, "..");
    const files = await fs.readdir(srcDir, { recursive: true });
    const tsFiles = files.filter((f) => f.endsWith(".ts") && !f.includes("__tests__"));

    for (const file of tsFiles) {
      const content = await fs.readFile(path.join(srcDir, file), "utf-8");
      // Check for telemetry-related executable symbols/imports (not prose)
      expect(content).not.toMatch(/import.*telemetry/i);
      expect(content).not.toMatch(/import.*analytics/i);
      expect(content).not.toMatch(/import.*tracking/i);
      expect(content).not.toMatch(/\btelemetry\s*[=(]/);
      expect(content).not.toMatch(/\banalytics\s*[=(]/);
      expect(content).not.toMatch(/\btracking\s*[=(]/);
    }
  });
});
