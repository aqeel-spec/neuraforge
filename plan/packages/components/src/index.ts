export * from "./contracts/index.js";
export * from "./feedback/index.js";
export * from "./forms/index.js";
export * from "./navigation-layout/index.js";
export * from "./data-display.js";
export * from "./data-display/index.js";
export * from "./marketing.js";
export * from "./marketing/index.js";
export * from "./catalog/index.js";

export const componentsBoundary = {
  id: "components",
  responsibility: "editable React and Tailwind component source",
  publicSource: true,
} as const;
