const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@neuraforge-ui/components",
    "@neuraforge-ui/tokens",
    "@neuraforge-ui/motion",
    "@neuraforge-ui/mcp-core",
    "@neuraforge-ui/compositions",
    "@neuraforge-ui/schemas",
    "@neuraforge-ui/catalog-core",
  ],
  webpack: (config) => {
    // The @neuraforge-ui packages use .js extensions in TS imports (ESM convention).
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    // Map sub-path imports to actual file paths (bypasses exports field restriction)
    const componentsBase = path.join(
      __dirname,
      "node_modules",
      "@neuraforge-ui",
      "components",
      "src"
    );

    config.resolve.alias = {
      ...config.resolve.alias,
      "@neuraforge-ui/components/src": componentsBase,
    };

    return config;
  },
};

module.exports = nextConfig;
