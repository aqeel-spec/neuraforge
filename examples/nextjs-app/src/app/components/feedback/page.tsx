"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import {
  Alert,
  Dialog,
  Toast,
  LoadingIndicator,
  Progress,
  Skeleton,
  EmptyState,
  ConfirmDialog,
} from "@neuraforge-ui/components/src/feedback/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeedbackPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Feedback</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          8 feedback components — alerts, dialogs, toasts, progress indicators, skeletons,
          empty states, and confirmation dialogs. All use proper ARIA roles and live regions.
        </p>
      </motion.div>

      {/* Alert */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="Alert"
          description="Status messages with 4 variants — info, success, warning, error"
          code={`import { Alert } from "@neuraforge-ui/components/src/feedback/index";

<Alert variant="info" title="Update available">
  A new version is ready to install.
</Alert>
<Alert variant="success" title="Published!">
  Your package is now live on npm.
</Alert>
<Alert variant="warning" title="Breaking change">
  This update includes API changes.
</Alert>
<Alert variant="error" title="Build failed">
  Check the console for errors.
</Alert>`}
        >
          <div className="w-full space-y-3">
            <Alert variant="info" title="Update available">
              A new version is ready to install.
            </Alert>
            <Alert variant="success" title="Published!">
              Your package is now live on npm.
            </Alert>
            <Alert variant="warning" title="Breaking change">
              This update includes API changes.
            </Alert>
            <Alert variant="error" title="Build failed">
              Check the console for errors.
            </Alert>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Dialog */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="Dialog"
          description="Modal dialog with focus trapping, Escape to close, and return-focus"
          code={`import { Dialog } from "@neuraforge-ui/components/src/feedback/index";

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Confirm action"
  description="This cannot be undone."
>
  <div className="flex gap-2 mt-4">
    <button onClick={() => setOpen(false)}>Cancel</button>
    <button onClick={handleConfirm}>Confirm</button>
  </div>
</Dialog>`}
        >
          <div>
            <button
              onClick={() => setDialogOpen(true)}
              className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              Open Dialog
            </button>
            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="Delete component?"
              description="This action cannot be undone. The component will be permanently removed from the registry."
            >
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </Dialog>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ConfirmDialog */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="ConfirmDialog"
          description="Pre-built confirmation dialog with confirm/cancel actions and danger variant"
          code={`import { ConfirmDialog } from "@neuraforge-ui/components/src/feedback/index";

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Reset all settings?"
  description="This will reset everything to defaults."
  onConfirm={() => handleReset()}
  confirmLabel="Reset"
  variant="danger"
/>`}
        >
          <div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Reset Settings
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Reset all settings?"
              description="This will restore all configuration to factory defaults. Your customizations will be lost."
              onConfirm={() => setConfirmOpen(false)}
              confirmLabel="Reset Everything"
              variant="destructive"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Toast */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="Toast"
          description="Non-modal notification with auto-dismiss and ARIA live region"
          code={`import { Toast } from "@neuraforge-ui/components/src/feedback/index";

{showToast && (
  <Toast
    title="Saved successfully"
    onDismiss={() => setShowToast(false)}
  />
)}`}
        >
          <div>
            <button
              onClick={() => setShowToast(true)}
              className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              Show Toast
            </button>
            {showToast && (
              <Toast title="Component installed ✓" onDismiss={() => setShowToast(false)} />
            )}
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Progress */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="Progress"
          description="Determinate progress bar with label, percentage, and color variants"
          code={`import { Progress } from "@neuraforge-ui/components/src/feedback/index";

<Progress label="Upload progress" value={65} max={100} />
<Progress label="Build" value={100} max={100} />`}
        >
          <div className="w-full space-y-6">
            <Progress label="Upload progress" value={65} max={100} />
            <Progress label="Build complete" value={100} max={100} />
            <Progress label="Processing" value={30} max={100} />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* LoadingIndicator */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="LoadingIndicator"
          description="Spinner with accessible label, supports determinate progress"
          code={`import { LoadingIndicator } from "@neuraforge-ui/components/src/feedback/index";

<LoadingIndicator label="Loading..." />
<LoadingIndicator label="Uploading" value={65} />`}
        >
          <div className="flex items-center gap-8">
            <LoadingIndicator label="Loading components..." />
            <LoadingIndicator label="Uploading" value={65} />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Skeleton */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="Skeleton"
          description="Placeholder loading state with shimmer animation"
          code={`import { Skeleton } from "@neuraforge-ui/components/src/feedback/index";

<Skeleton width="100%" height="20px" />
<Skeleton width="60%" height="16px" />
<Skeleton width="200px" height="200px" variant="circular" />`}
        >
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton width="40px" height="40px" variant="circular" />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" />
              </div>
            </div>
            <Skeleton width="100%" height="80px" />
            <div className="flex gap-2">
              <Skeleton width="80px" height="32px" />
              <Skeleton width="80px" height="32px" />
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* EmptyState */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          title="EmptyState"
          description="Placeholder for empty lists with icon, message, and action"
          code={`import { EmptyState } from "@neuraforge-ui/components/src/feedback/index";

<EmptyState
  title="No components found"
  description="Try adjusting your search or filters."
  action={{ label: "Clear filters", onClick: () => reset() }}
/>`}
        >
          <div className="w-full">
            <EmptyState
              title="No components found"
              description="Try adjusting your search or filters to find what you need."
              action={{ label: "Clear filters", onClick: () => {} }}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
