import { useId } from "react";
import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

export interface FormValidationError {
  fieldId: string;
  message: string;
}

export interface FormProps extends Omit<ComponentPropsWithoutRef<"form">, "children" | "onSubmit"> {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Accessible name for the form.
   *
   * A `<form>` element only exposes the ARIA `form` landmark role when it has an accessible
   * name, so supplying `label` is what makes the form discoverable in a landmark listing.
   * It is optional rather than required because a form nested inside an already-labelled
   * region (a single-field search box, for example) should not add a redundant landmark.
   */
  label?: string;
  validationErrors?: readonly FormValidationError[];
  status?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
}

export function Form({
  children,
  onSubmit,
  label,
  validationErrors = [],
  status,
  disabled = false,
  isSubmitting = false,
  submitLabel = "Submit",
  submittingLabel = "Submitting…",
  "aria-describedby": ariaDescribedBy,
  ...formProps
}: FormProps) {
  const generatedId = useId();
  const errorSummaryId = `${generatedId}-errors`;
  const statusId = `${generatedId}-status`;
  const describedBy =
    [
      ariaDescribedBy,
      validationErrors.length > 0 ? errorSummaryId : undefined,
      status ? statusId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (disabled || isSubmitting || validationErrors.length > 0) {
      event.preventDefault();
      return;
    }
    onSubmit(event);
  }
  return (
    <form
      {...formProps}
      aria-label={label}
      aria-busy={isSubmitting}
      aria-describedby={describedBy}
      onSubmit={handleSubmit}
    >
      {validationErrors.length > 0 ? (
        <div
          id={errorSummaryId}
          role="alert"
          className="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-950"
        >
          <strong>Check the form</strong>
          <ul className="mt-2 list-disc pl-5">
            {validationErrors.map(({ fieldId, message }) => (
              <li key={`${fieldId}-${message}`}>
                <a
                  href={`#${fieldId}`}
                  className="underline outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                >
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <fieldset
        disabled={disabled || isSubmitting}
        className="min-w-0 space-y-4 disabled:opacity-70"
      >
        <legend className="sr-only">Form fields</legend>
        {children}
      </fieldset>
      {status ? (
        <p id={statusId} role="status" aria-live="polite" className="mt-3 text-sm text-slate-700">
          {status}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white outline-none hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
