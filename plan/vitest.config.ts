import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    environmentMatchGlobs: [["**/*.react.test.ts?(x)", "jsdom"]],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/*.integration.test.ts", "**/*.property.test.ts", "node_modules/**"],
    setupFiles: ["./tests/setup/react.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["packages/*/src/**/*.ts", "services/*/src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.property.test.ts",
        "**/*.integration.test.ts",
        "**/index.ts",
        "**/__tests__/**",
        "**/react-components.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
