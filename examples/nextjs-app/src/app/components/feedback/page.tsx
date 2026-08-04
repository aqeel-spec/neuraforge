"use client";

import React, { useState } from "react";
import { ComponentPreview } from "@/components/component-preview";
import {
  Alert,
  Dialog,
  Toast,
  LoadingIndicator,
} from "@neuraforge-ui/components/src/feedback/index";

export default function FeedbackPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Components that communicate status — Alert, Dialog, Toast, and LoadingIndicator.
          All use proper ARIA roles and live regions.
        </p>
      </div>

      {/* Alerts */}
      <ComponentPreview
        title="Alert"
        description="Status messages with 4 variants — info, success, warning, error"
        code={`import { Alert } from "@neuraforge-ui/components";

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
          <Alert variant="warning" title="Breaking change" onDismiss={() => {}}>
            This update includes API changes.
          </Alert>
          <Alert variant="error" title="Build failed">
            Check the console for errors.
          </Alert>
        </div>
      </ComponentPreview>

      {/* Dialog */}
      <ComponentPreview
        title="Dialog"
        description="Modal dialog with focus trapping, Escape to close, and return-focus"
        code={`import { Dialog } from "@neuraforge-ui/components";

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Confirm action"
  description="This cannot be undone."
>
  <button onClick={() => setOpen(false)}>Cancel</button>
  <button onClick={handleConfirm}>Confirm</button>
</Dialog>`}
      >
        <div>
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open Dialog
          </button>
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="Delete component?"
            description="This action cannot be undone. The component will be permanently removed."
          >
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Dialog>
        </div>
      </ComponentPreview>

      {/* Toast */}
      <ComponentPreview
        title="Toast"
        description="Non-modal notification with auto-dismiss and ARIA live region"
        code={`import { Toast } from "@neuraforge-ui/components";

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
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Show Toast
          </button>
          {showToast && (
            <Toast title="Component installed ✓" onDismiss={() => setShowToast(false)} />
          )}
        </div>
      </ComponentPreview>

      {/* Loading Indicator */}
      <ComponentPreview
        title="LoadingIndicator"
        description="Spinner with accessible label, supports determinate progress"
        code={`import { LoadingIndicator } from "@neuraforge-ui/components";

<LoadingIndicator label="Loading..." />
<LoadingIndicator label="Uploading" value={65} />`}
      >
        <div className="flex items-center gap-6">
          <LoadingIndicator label="Loading components..." />
          <LoadingIndicator label="Uploading" value={65} />
        </div>
      </ComponentPreview>
    </div>
  );
}
