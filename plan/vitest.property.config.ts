import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.property.test.ts", "**/*.property.test.tsx"],
    passWithNoTests: true,
    testTimeout: 30_000,
  },
});
