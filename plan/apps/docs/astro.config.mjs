import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://neuraforge.dev",
  outDir: "./dist",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});
