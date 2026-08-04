import type { HTMLAttributes } from "react";
import { classes } from "./shared.js";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface StepIndicatorProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  steps: readonly Step[];
  currentStep: string;
  orientation?: "horizontal" | "vertical";
}

/**
 * A multi-step progress indicator.
 *
 * - Renders as an ordered list (`<ol>`) with `aria-label="Progress"`.
 * - Each step has `aria-current="step"` when it is the active step.
 * - Completed steps (before the current) are visually distinguished.
 * - Supports horizontal and vertical orientations.
 * - Purely visual/semantic — does not handle step navigation.
 */
export function StepIndicator({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
  ...props
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Progress" className={className} {...props}>
      <ol
        role="list"
        className={classes(
          "flex",
          orientation === "horizontal" ? "items-center gap-0" : "flex-col gap-0",
        )}
      >
        {steps.map((step, index) => {
          const status: "complete" | "current" | "upcoming" =
            index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";

          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              aria-current={status === "current" ? "step" : undefined}
              className={classes(
                "flex",
                orientation === "horizontal" ? "flex-1 items-center" : "items-start",
              )}
            >
              {/* Step content */}
              <div
                className={classes(
                  "flex",
                  orientation === "horizontal"
                    ? "flex-col items-center text-center"
                    : "flex-row items-start gap-3",
                )}
              >
                {/* Step circle */}
                <div
                  aria-hidden="true"
                  className={classes(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    status === "complete"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : status === "current"
                        ? "border-slate-900 bg-white text-slate-900"
                        : "border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {status === "complete" ? <span aria-hidden="true">✓</span> : index + 1}
                </div>

                {/* Labels */}
                <div className={classes(orientation === "horizontal" ? "mt-2" : "")}>
                  <div
                    className={classes(
                      "text-sm font-medium",
                      status === "complete"
                        ? "text-slate-900"
                        : status === "current"
                          ? "text-slate-950"
                          : "text-slate-500",
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description ? (
                    <div className="mt-0.5 text-xs text-slate-500">{step.description}</div>
                  ) : null}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={classes(
                    orientation === "horizontal"
                      ? "mx-2 h-0.5 flex-1"
                      : "ml-4 mt-1 mb-1 w-0.5 min-h-[24px]",
                    index < currentIndex ? "bg-slate-900" : "bg-slate-200",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
