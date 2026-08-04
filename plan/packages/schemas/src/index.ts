import commonSchemaV1 from "../schemas/v1/common.schema.json";

export const schemasBoundary = {
  id: "schemas",
  responsibility: "versioned public schemas and generated types",
  publicSource: true,
} as const;

export const COMMON_SCHEMA_VERSION = "1.0.0";
export const CANONICALIZATION_VERSION = "neuraforge-canonical-v1";
export { commonSchemaV1 };
export type * from "./generated/v1.js";
