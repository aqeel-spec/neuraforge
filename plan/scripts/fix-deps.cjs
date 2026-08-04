const fs = require("fs");
const path = require("path");

const files = [
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
  "packages/self-hosting/package.json",
  "services/public-api/package.json",
  "services/hosted-gateway/package.json",
  "apps/docs/package.json",
];

for (const file of files) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, "utf8");
  // Replace all "0.0.0" with "0.1.0" (catches internal deps)
  content = content.split('"0.0.0"').join('"0.1.0"');
  fs.writeFileSync(fullPath, content);
  console.log("Fixed deps:", file);
}

console.log("\nAll internal dependencies updated to 0.1.0");
