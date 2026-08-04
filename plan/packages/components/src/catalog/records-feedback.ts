import type { ComponentRecord } from "../contracts/types.js";
import {
  behaviorMap,
  noExternalPrimitive,
  notApplicable,
  supported,
} from "../contracts/builders.js";
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
import type { FileRecord, Checksum } from "@neuraforge-ui/schemas";

export function createFeedbackRecords(files: {
  alert: { sourceFiles: FileRecord[]; checksum: Checksum };
  dialog: { sourceFiles: FileRecord[]; checksum: Checksum };
  loadingIndicator: { sourceFiles: FileRecord[]; checksum: Checksum };
  toast: { sourceFiles: FileRecord[]; checksum: Checksum };
}): ComponentRecord[] {
  const alert: ComponentRecord = {
    ref: { kind: "component", stableId: "alert", version: "1.0.0" },
    status: "stable",
    category: "feedback",
    sourceFiles: files.alert.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("alert"),
    checksum: files.alert.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("feedback", "alert"),
    props: [
      { name: "title", type: "node", required: true, description: "Alert heading" },
      { name: "children", type: "node", required: false, description: "Alert body content" },
      {
        name: "variant",
        type: "enum",
        required: false,
        description: "Visual tone",
        allowedValues: ["info", "success", "warning", "error"],
        defaultValue: "info",
      },
      {
        name: "dismissLabel",
        type: "string",
        required: false,
        description: "Accessible label for dismiss button",
        defaultValue: "Dismiss alert",
      },
      {
        name: "onDismiss",
        type: "function",
        required: false,
        description: "Callback when dismissed",
      },
    ],
    supportedStates: [
      { name: "visible", description: "Alert is rendered and announced" },
      { name: "dismissed", description: "Alert has been dismissed (unmounted by parent)" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab reaches dismiss button; Enter/Space dismisses"),
        pointer: supported("Click dismiss button removes alert"),
        focus: supported("Visible focus ring on dismiss button"),
        error: supported("Error and warning variants use role=alert with assertive live region"),
      },
      notApplicable("Alert has no disabled, loading, or validation states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "alert-error",
        title: "Error Alert",
        description: "An error alert with dismiss",
        props: { title: "Error", variant: "error" },
        sourcePath: "examples/alert-error.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1.5)],
    performanceRecords: [bundleSizeRecord("alert", 0.9, 1.5)],
  };

  const dialog: ComponentRecord = {
    ref: { kind: "component", stableId: "dialog", version: "1.0.0" },
    status: "stable",
    category: "feedback",
    sourceFiles: files.dialog.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("dialog"),
    checksum: files.dialog.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("feedback", "dialog"),
    props: [
      { name: "open", type: "boolean", required: true, description: "Whether the dialog is open" },
      {
        name: "onOpenChange",
        type: "function",
        required: true,
        description: "Callback when open state changes",
      },
      {
        name: "title",
        type: "node",
        required: true,
        description: "Dialog title (aria-labelledby)",
      },
      { name: "description", type: "node", required: false, description: "Dialog description" },
      { name: "children", type: "node", required: true, description: "Dialog body content" },
      {
        name: "closeLabel",
        type: "string",
        required: false,
        description: "Accessible close button label",
        defaultValue: "Close dialog",
      },
      {
        name: "initialFocusRef",
        type: "object",
        required: false,
        description: "Ref to element receiving initial focus",
      },
    ],
    supportedStates: [
      { name: "open", description: "Dialog is visible and focus is trapped within" },
      { name: "closed", description: "Dialog is not rendered" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported(
          "Escape closes; Tab cycles focus within panel; Shift+Tab cycles backward",
        ),
        pointer: supported("Click backdrop closes; click close button closes"),
        focus: supported(
          "Focus moves to initialFocusRef or first focusable; restores focus on close",
        ),
      },
      notApplicable("Dialog has no disabled, loading, validation, or error states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "dialog-basic",
        title: "Basic Dialog",
        description: "A modal dialog",
        props: { open: true, title: "Confirm" },
        sourcePath: "examples/dialog-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(3)],
    performanceRecords: [bundleSizeRecord("dialog", 2.3, 3)],
  };

  const loadingIndicator: ComponentRecord = {
    ref: { kind: "component", stableId: "loading-indicator", version: "1.0.0" },
    status: "stable",
    category: "feedback",
    sourceFiles: files.loadingIndicator.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("loading-indicator"),
    checksum: files.loadingIndicator.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("feedback", "loading-indicator"),
    props: [
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible label",
        defaultValue: "Loading…",
      },
      { name: "value", type: "number", required: false, description: "Determinate progress 0-100" },
    ],
    supportedStates: [
      { name: "indeterminate", description: "Spinner with no progress value" },
      { name: "determinate", description: "Progress bar with numeric value" },
    ],
    behavior: behaviorMap(
      {
        loading: supported(
          "Indeterminate mode uses role=status; determinate uses role=progressbar with aria-valuenow",
        ),
        focus: supported("Not focusable; purely informational"),
      },
      notApplicable(
        "LoadingIndicator has no keyboard, pointer, disabled, validation, or error states",
      ),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: {
      includesAnimationOrMotion: true,
      reducedMotionBehavior:
        "Spinner animation is disabled via motion-reduce:animate-none; text label remains visible",
    },
    examples: [
      {
        id: "loading-basic",
        title: "Indeterminate Loading",
        description: "A spinner",
        props: { label: "Loading…" },
        sourcePath: "examples/loading-basic.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1)],
    performanceRecords: [bundleSizeRecord("loading-indicator", 0.4, 1)],
  };

  const toast: ComponentRecord = {
    ref: { kind: "component", stableId: "toast", version: "1.0.0" },
    status: "stable",
    category: "feedback",
    sourceFiles: files.toast.sourceFiles,
    generatedFiles: [],
    dependencies: STANDARD_DEPS,
    peerDependencies: STANDARD_PEER_DEPS,
    compatibility: STANDARD_COMPATIBILITY,
    installation: standardInstall("toast"),
    checksum: files.toast.checksum,
    provenance: [MIT_PROVENANCE],
    documentationPath: docPath("feedback", "toast"),
    props: [
      { name: "title", type: "node", required: true, description: "Toast heading" },
      { name: "children", type: "node", required: false, description: "Toast body content" },
      {
        name: "tone",
        type: "enum",
        required: false,
        description: "Notification tone",
        allowedValues: ["status", "error"],
        defaultValue: "status",
      },
      {
        name: "dismissLabel",
        type: "string",
        required: false,
        description: "Accessible dismiss label",
        defaultValue: "Dismiss notification",
      },
      { name: "onDismiss", type: "function", required: false, description: "Callback on dismiss" },
    ],
    supportedStates: [
      { name: "visible", description: "Toast is shown at the bottom of the viewport" },
    ],
    behavior: behaviorMap(
      {
        keyboard: supported("Tab reaches dismiss button; Enter/Space dismisses"),
        pointer: supported("Click dismiss button removes toast"),
        focus: supported("Visible focus ring on dismiss button"),
        error: supported("Error tone uses role=alert with assertive live region"),
      },
      notApplicable("Toast has no disabled, loading, or validation states"),
    ),
    accessibilityPrimitive: noExternalPrimitive(),
    capability: { requiresOptionalCapability: false },
    reducedMotion: { includesAnimationOrMotion: false },
    examples: [
      {
        id: "toast-status",
        title: "Status Toast",
        description: "A status notification",
        props: { title: "Saved" },
        sourcePath: "examples/toast-status.tsx",
      },
    ],
    performanceBudgets: [bundleSizeBudget(1.5)],
    performanceRecords: [bundleSizeRecord("toast", 1.0, 1.5)],
  };

  return [alert, dialog, loadingIndicator, toast];
}
