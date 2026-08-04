'use client';

import { classes, focusRing } from "./shared.js";

export interface Segment {
  id: string;
  label: string;
}

export interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
  lg: "px-5 py-2 text-base",
};

export function SegmentedControl({
  segments,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label="View selection"
      className={classes("inline-flex rounded-lg bg-slate-100 p-1", className)}
    >
      {segments.map((segment) => {
        const isSelected = segment.id === value;
        return (
          <button
            key={segment.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(segment.id)}
            className={classes(
              "rounded-md font-medium transition-all",
              focusRing,
              sizeClasses[size],
              isSelected
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
