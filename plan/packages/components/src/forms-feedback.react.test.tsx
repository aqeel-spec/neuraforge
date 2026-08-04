import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Alert, Dialog, Form, LoadingIndicator, TextField, Toast } from "./index.js";

describe("TextField", () => {
  it("connects its label, description, and supplied validation error", () => {
    render(<TextField label="Email" description="Work address" error="Email is invalid" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAccessibleDescription("Work address Email is invalid");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is invalid");
  });

  it("announces native constraint errors and respects disabled state", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <TextField label="Name" required />
        <button>Save</button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).not.toBeEmptyDOMElement();
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<TextField label="Name" disabled />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
  });
});

describe("Form", () => {
  it("announces errors and blocks submission until they are resolved", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <Form
        onSubmit={onSubmit}
        validationErrors={[{ fieldId: "email", message: "Enter an email" }]}
        status="Not saved"
      >
        <TextField id="email" label="Email" />
      </Form>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an email");
    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(
      <Form onSubmit={onSubmit}>
        <TextField id="email" label="Email" />
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables fields and announces its loading state", () => {
    render(
      <Form onSubmit={vi.fn()} label="Search" isSubmitting>
        <TextField label="Query" />
      </Form>,
    );
    expect(screen.getByRole("form", { name: "Search" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("textbox", { name: "Query" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  });

  it("exposes no form landmark when no accessible name is supplied", () => {
    render(
      <Form onSubmit={vi.fn()}>
        <TextField label="Query" />
      </Form>,
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});

function DialogFixture() {
  const [open, setOpen] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open settings
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Settings"
        description="Change preferences"
        initialFocusRef={primaryRef}
      >
        <button ref={primaryRef} type="button">
          Save settings
        </button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("moves focus in, closes with Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<DialogFixture />);
    const trigger = screen.getByRole("button", { name: "Open settings" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Settings" })).toHaveAccessibleDescription(
      "Change preferences",
    );
    expect(screen.getByRole("button", { name: "Save settings" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("supports pointer dismissal from the backdrop", async () => {
    render(<DialogFixture />);
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement;
    if (!backdrop) throw new Error("expected dialog to have a parent element");
    fireEvent.mouseDown(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
describe("feedback announcements", () => {
  it("uses assertive semantics for urgent alerts and supports keyboard dismissal", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <Alert title="Could not save" variant="error" onDismiss={onDismiss}>
        Try again.
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not saveTry again.");
    await user.tab();
    expect(screen.getByRole("button", { name: "Dismiss alert" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("exposes toast status and an accessible pointer dismissal action", async () => {
    const onDismiss = vi.fn();
    render(
      <Toast title="Saved" onDismiss={onDismiss}>
        Your changes are available.
      </Toast>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("exposes indeterminate and clamped determinate loading states", () => {
    const { rerender } = render(<LoadingIndicator label="Loading projects" />);
    expect(screen.getByRole("status", { name: "Loading projects" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    rerender(<LoadingIndicator label="Uploading" value={140} />);
    const progress = screen.getByRole("progressbar", { name: "Uploading" });
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(progress).toHaveTextContent("100%");
  });
});
