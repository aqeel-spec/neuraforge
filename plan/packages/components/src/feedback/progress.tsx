import type { HTMLAttributes } from "react";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  label: string;
  variant?: "linear" | "circular";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const linearSizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const;

const circularSizes = {
  sm: { box: "size-8", stroke: 3, radius: 12 },
  md: { box: "size-12", stroke: 4, radius: 18 },
  lg: { box: "size-16", stroke: 5, radius: 24 },
} as const;

export function Progress({
  value,
  max = 100,
  label,
  variant = "linear",
  size = "md",
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const percentage = max > 0 ? Math.round((clamped / max) * 100) : 0;

  if (variant === "circular") {
    const { box, stroke, radius } = circularSizes[size];
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const svgSize = (radius + stroke) * 2;

    return (
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className={`inline-flex items-center justify-center ${box} ${className ?? ""}`}
        {...props}
      >
        <svg
          viewBox={`0 0 ${String(svgSize)} ${String(svgSize)}`}
          className="rotate-[-90deg]"
          aria-hidden="true"
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200"
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-indigo-600 transition-[stroke-dashoffset] duration-300"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={`w-full ${className ?? ""}`}
      {...props}
    >
      <div className={`overflow-hidden rounded-full bg-slate-200 ${linearSizes[size]}`}>
        <div
          className={`h-full rounded-full bg-indigo-600 transition-[width] duration-300`}
          style={{ width: `${String(percentage)}%` }}
        />
      </div>
    </div>
  );
}
