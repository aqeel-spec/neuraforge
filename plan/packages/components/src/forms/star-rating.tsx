import { useId, useState } from "react";
import type { KeyboardEvent } from "react";

export interface StarRatingProps {
  /** Current rating value */
  value?: number;
  /** Called when the rating changes */
  onChange?: (value: number) => void;
  /** Maximum number of stars */
  max?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether the rating is read-only */
  readOnly?: boolean;
  /** Enable half-star ratings */
  halfStars?: boolean;
  /** Accessible label for the rating group */
  label?: string;
  /** Additional CSS class names */
  className?: string;
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

function StarFilled({ className }: { className: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarEmpty({ className }: { className: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function StarHalf({ className }: { className: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="half-star-grad">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        fill="url(#half-star-grad)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export function StarRating({
  value: controlledValue,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  halfStars = false,
  label = "Rating",
  className,
}: StarRatingProps) {
  const generatedId = useId();

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(0);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const currentValue = isControlled ? controlledValue : internalValue;
  const displayValue = hoverValue !== null && !readOnly ? hoverValue : currentValue;

  function setValue(next: number) {
    if (readOnly) return;
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (readOnly) return;
    const step = halfStars ? 0.5 : 1;
    let next = currentValue;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      next = Math.min(currentValue + step, max);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      next = Math.max(currentValue - step, 0);
    } else if (event.key === "Home") {
      event.preventDefault();
      next = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      next = max;
    } else {
      return;
    }
    setValue(next);
  }

  function getStarState(index: number): "full" | "half" | "empty" {
    const starPosition = index + 1;
    if (displayValue >= starPosition) return "full";
    if (halfStars && displayValue >= starPosition - 0.5) return "half";
    return "empty";
  }

  function handleStarClick(index: number, isLeftHalf: boolean) {
    if (readOnly) return;
    const rating = halfStars && isLeftHalf ? index + 0.5 : index + 1;
    setValue(rating);
  }

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        tabIndex={readOnly ? -1 : 0}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverValue(null)}
        className={[
          "inline-flex items-center gap-0.5 outline-none",
          !readOnly
            ? "cursor-pointer focus-visible:rounded focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            : "",
        ].join(" ")}
      >
        {Array.from({ length: max }, (_, index) => {
          const state = getStarState(index);
          const starLabel = `${index + 1} star${index + 1 !== 1 ? "s" : ""}`;
          const isSelected = currentValue === index + 1 || (halfStars && currentValue === index + 0.5);

          return (
            <span
              key={index}
              role="radio"
              aria-checked={isSelected}
              aria-label={starLabel}
              className={[
                "relative inline-flex",
                !readOnly ? "hover:scale-110 transition-transform" : "",
              ].join(" ")}
              onMouseEnter={() => {
                if (!readOnly) setHoverValue(index + 1);
              }}
              onClick={() => handleStarClick(index, false)}
            >
              {/* For half-star hover detection */}
              {halfStars && !readOnly ? (
                <>
                  <span
                    className="absolute inset-y-0 left-0 w-1/2 z-10"
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoverValue(index + 0.5);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(index, true);
                    }}
                  />
                  <span
                    className="absolute inset-y-0 right-0 w-1/2 z-10"
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoverValue(index + 1);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(index, false);
                    }}
                  />
                </>
              ) : null}

              {state === "full" ? (
                <StarFilled
                  className={`${sizeClass} text-amber-400 dark:text-amber-300`}
                />
              ) : state === "half" ? (
                <StarHalf
                  className={`${sizeClass} text-amber-400 dark:text-amber-300`}
                />
              ) : (
                <StarEmpty
                  className={`${sizeClass} text-slate-300 dark:text-slate-600`}
                />
              )}

              {/* Hidden radio input for form submission */}
              <input
                type="radio"
                name={`${generatedId}-star`}
                value={index + 1}
                checked={currentValue === index + 1}
                onChange={() => setValue(index + 1)}
                disabled={readOnly}
                className="sr-only"
                tabIndex={-1}
              />
            </span>
          );
        })}
      </div>
      {/* Screen reader announcement */}
      <span className="sr-only" aria-live="polite">
        {`Current rating: ${currentValue} out of ${max}`}
      </span>
    </div>
  );
}
