const fs = require("fs");
const path = require("path");

const VERSION = "0.1.0";
const REPO = "https://github.com/aqeel-spec/neuraforge.git";

const files = [
  "package.json",
  "packages/schemas/package.json",
  "packages/catalog-core/package.json",
  "packages/tokens/package.json",
  "packages/components/package.json",
  "packages/motion/package.json",
  "packages/three-d/package.json",
  "packages/compositions/package.json",
  "packages/registry-builder/package.json",
  "packages/mcp-core/package.json",
  "packages/cli/package.json",
  "packages/conformance/package.json",
  "packages/telemetry/package.json",
  "packages/self-hosting/package.json",
  "packages/release-policy/package.json",
  "services/public-api/package.json",
  "services/hosted-gateway/package.json",
  "apps/docs/package.json",
];

for (const file of files) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${file} (not found)`);
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  pkg.version = VERSION;
  if (pkg.repository) {
    pkg.repository = REPO;
  }
  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`OK: ${file} -> v${VERSION}`);
}

console.log("\nDone! All packages set to v" + VERSION);
console.log("Repository URL set to: " + REPO);
