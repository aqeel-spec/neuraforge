import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(packageRoot, "schemas/v1/common.schema.json");
const outputPath = resolve(packageRoot, "src/generated/v1.ts");
const schema = JSON.parse(await readFile(schemaPath, "utf8"));

function referenceName(reference) {
  const prefix = "#/definitions/";
  if (!reference.startsWith(prefix)) {
    throw new Error(`Unsupported external schema reference: ${reference}`);
  }
  return reference.slice(prefix.length);
}

function literal(value) {
  return JSON.stringify(value);
}

function propertyName(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(name) ? name : JSON.stringify(name);
}

function schemaType(node, indent = "") {
  if (node.$ref) return referenceName(node.$ref);
  if (Object.hasOwn(node, "const")) return literal(node.const);
  if (node.enum) return node.enum.map(literal).join(" | ");
  if (node.anyOf) return node.anyOf.map((entry) => schemaType(entry, indent)).join(" | ");
  if (node.oneOf) return node.oneOf.map((entry) => schemaType(entry, indent)).join(" | ");

  switch (node.type) {
    case "null":
      return "null";
    case "boolean":
      return "boolean";
    case "number":
    case "integer":
      return "number";
    case "string":
      return "string";
    case "array":
      return `Array<${schemaType(node.items, indent)}>`;
    case "object":
      return objectType(node, indent);
    default:
      throw new Error(`Unsupported schema node: ${JSON.stringify(node)}`);
  }
}

function objectType(node, indent) {
  const entries = Object.entries(node.properties ?? {});
  if (entries.length === 0 && node.additionalProperties && node.additionalProperties !== true) {
    return `{ [key: string]: ${schemaType(node.additionalProperties, indent)} }`;
  }

  const required = new Set(node.required ?? []);
  const childIndent = `${indent}  `;
  const properties = entries.map(([name, property]) => {
    const optional = required.has(name) ? "" : "?";
    return `${childIndent}${propertyName(name)}${optional}: ${schemaType(property, childIndent)};`;
  });
  return `{\n${properties.join("\n")}\n${indent}}`;
}

const generatedDefinitions = Object.entries(schema.definitions)
  .map(([name, definition]) => `export type ${name} = ${schemaType(definition)};`)
  .join("\n\n");

const source = await format(
  `/**
 * Generated from schemas/v1/common.schema.json.
 * Do not edit directly; run npm run schemas:generate.
 */
/* eslint-disable @typescript-eslint/array-type, @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions */

${generatedDefinitions}

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = ErrorEnvelope> = Ok<T> | Err<E>;
`,
  {
    parser: "typescript",
    arrowParens: "always",
    endOfLine: "lf",
    printWidth: 100,
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "all",
  },
);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    // A missing generated file is reported as drift below.
  }
  if (current !== source) {
    console.error("Generated schema types are out of date. Run npm run schemas:generate.");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, source, "utf8");
  console.log(`Generated ${outputPath}`);
}
