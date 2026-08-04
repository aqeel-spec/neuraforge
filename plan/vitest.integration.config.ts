import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts", "**/*.integration.test.tsx"],
    passWithNoTests: true,
    testTimeout: 30_000,
  },
});
