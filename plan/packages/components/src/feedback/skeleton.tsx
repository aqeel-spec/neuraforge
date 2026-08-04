import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantClasses = {
  text: "rounded",
  circular: "rounded-full",
  rectangular: "rounded-md",
} as const;

const defaultDimensions = {
  text: { width: "100%", height: "1em" },
  circular: { width: "2.5rem", height: "2.5rem" },
  rectangular: { width: "100%", height: "4rem" },
} as const;

export function Skeleton({ variant = "text", width, height, className, ...props }: SkeletonProps) {
  const resolvedWidth = width ?? defaultDimensions[variant].width;
  const resolvedHeight = height ?? defaultDimensions[variant].height;

  return (
    <div
      role="status"
      aria-label="Loading content"
      aria-busy="true"
      className={`animate-pulse bg-slate-200 motion-reduce:animate-none ${variantClasses[variant]} ${className ?? ""}`}
      style={{
        width: typeof resolvedWidth === "number" ? `${String(resolvedWidth)}px` : resolvedWidth,
        height: typeof resolvedHeight === "number" ? `${String(resolvedHeight)}px` : resolvedHeight,
      }}
      {...props}
    >
      <span className="sr-only">Loading content</span>
    </div>
  );
}
