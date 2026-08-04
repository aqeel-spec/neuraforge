import { useState, type FormEvent } from "react";

export interface NewsletterProps {
  /** Section heading */
  title?: string;
  /** Descriptive text below the title */
  description?: string;
  /** Placeholder text for the email input */
  placeholder?: string;
  /** Submit button label */
  buttonText?: string;
  /** Callback when form is submitted with a valid email */
  onSubmit?: (email: string) => void | Promise<void>;
  /** Legal disclaimer text shown below the form */
  disclaimer?: string;
  /** Additional CSS classes */
  className?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * Newsletter — Email signup section with validation and status feedback.
 * WCAG 2.2 AA compliant, keyboard navigable, SSR-safe.
 */
export function Newsletter({
  title = "Subscribe to our newsletter",
  description,
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  onSubmit,
  disclaimer,
  className,
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!EMAIL_REGEX.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      await onSubmit?.(email);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section
      className={joinClasses("py-12 px-4 sm:px-6 lg:px-8", className)}
      aria-labelledby="newsletter-title"
    >
      <div className="max-w-xl mx-auto text-center">
        <h2
          id="newsletter-title"
          className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
          noValidate
          aria-describedby={disclaimer ? "newsletter-disclaimer" : undefined}
        >
          <div className="flex-1 min-w-0">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setErrorMessage("");
                }
              }}
              placeholder={placeholder}
              required
              aria-invalid={status === "error" ? "true" : undefined}
              aria-describedby={
                status === "error" ? "newsletter-error" : undefined
              }
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={status === "submitting"}
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "submitting" ? "Submitting\u2026" : buttonText}
          </button>
        </form>

        {/* Status messages */}
        <div className="mt-3 min-h-[1.5rem]" aria-live="polite" role="status">
          {status === "success" && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Thank you for subscribing!
            </p>
          )}
          {status === "error" && errorMessage && (
            <p
              id="newsletter-error"
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
        </div>

        {disclaimer && (
          <p
            id="newsletter-disclaimer"
            className="mt-3 text-xs text-gray-500 dark:text-gray-500"
          >
            {disclaimer}
          </p>
        )}
      </div>
    </section>
  );
}
