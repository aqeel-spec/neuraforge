import type { ComponentRecord } from "../contracts/types.js";
import { behaviorMap, noExternalPrimitive, supported } from "../contracts/builders.js";
import {
  bundleSizeBudget,
  bundleSizeRecord,
  docPath,
  MIT_PROVENANCE,
  STANDARD_COMPATIBILITY,
  STANDARD_DEPS,
  STANDARD_PEER_DEPS,
  standardInstall,
} from "./builders.js";
import type { FileRecord, Checksum } from "@neuraforge/schemas";

export function createFormsRecords(files: {
  form: { sourceFiles: FileRecord[]; checksum: Checksum };
  textField: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const form: ComponentRecord = {
    ref: { kind: "component", stableId: "form", version: "1.0.0" },
    status: "stable",
    category: "forms",
    sourceFiles: files.form.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("form"),
    checksum: files.form.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("forms", "form"),
    props: [
      { name: "children", type: "node", required: true, description: "Form field content" },
      { name: "onSubmit", type: "function", required: true, description: "Submit handler" },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible form name (creates a landmark)",
      },
      {
        name: "validationErrors",
        type: "array",
        required: false,
        description: "Array of field validation errors to display",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Status message shown as a polite announcement",
      },
      {
        name: "disabled",
        type: "boolean",
        required: false,
        description: "Disables all form fields",
        defaultValue: false,
      },
      {
        name: "isSubmitting",
        type: "boolean",
        required: false,
        description: "Shows submitting state",
        defaultValue: false,
      },
      {
        name: "submitLabel",
        type: "string",
        required: false,
        description: "Submit button text",
        defaultValue: "Submit",
      },
      {
        name: "submittingLabel",
        type: "string",
        required: false,
        description: "Text during submission",
        defaultValue: "Submitting…",
      },
    ],
    supportedStates: [
      { name: "idle", description: "Form is ready for input" },
      { name: "submitting", description: "Form is being submitted; fields are disabled" },
      { name: "disabled", description: "All fields are disabled" },
      { name: "has-errors", description: "Validation errors are displayed" },
    ],
    behavior: behaviorMap({
      keyboard: supported(
        "Tab navigates fields; Enter submits if no errors; error links are keyboard accessible",
      ),
      pointer: supported("Click submits; click error links focus the relevant field"),
      focus: supported("Error summary links move focus to referenced fields"),
      disabled: supported("Sets disabled on fieldset; submit button becomes disabled"),
      loading: supported("isSubmitting disables all fields and changes button label"),
      validation: supported(
        "Displays error summary with links to fields; blocks submission when errors present",
      ),
      error: supported("Error summary rendered as role=alert with live region"),
    }),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "form-basic",
        title: "Basic Form",
        description: "A form with validation",
        props: { children: null, onSubmit: null },
        sourcePath: "examples/form-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(3)],
    performanceRecords: [bundleSizeRecord("form", 2.1, 3)],
  };

  const textField: ComponentRecord = {
    ref: { kind: "component", stableId: "text-field", version: "1.0.0" },
    status: "stable",
    category: "forms",
    sourceFiles: files.textField.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("text-field"),
    checksum: files.textField.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("forms", "text-field"),
    props: [
      { name: "label", type: "string", required: true, description: "Visible label text" },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Helper text below the label",
      },
      { name: "error", type: "string", required: false, description: "Error message to display" },
    ],
    supportedStates: [
      { name: "default", description: "Input ready for text entry" },
      { name: "focused", description: "Input has keyboard focus" },
      { name: "disabled", description: "Input is disabled" },
      { name: "invalid", description: "Input has a validation error" },
    ],
    behavior: behaviorMap({
      keyboard: supported("Standard text input keyboard behavior; Tab focuses, typing enters text"),
      pointer: supported("Click focuses the input"),
      focus: supported("Visible focus ring with color change on the input border"),
      disabled: supported("Renders disabled attribute; shows disabled styling"),
      validation: supported(
        "Displays native constraint errors on invalid event; shows provided error prop",
      ),
      error: supported("Error text rendered as role=alert; input linked via aria-describedby"),
    }),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "text-field-basic",
        title: "Basic TextField",
        description: "A labelled text input",
        props: { label: "Email" },
        sourcePath: "examples/text-field-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(2)],
    performanceRecords: [bundleSizeRecord("text-field", 1.6, 2)],
  };

  return [form, textField];
}
