import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "./shared.js";

const containerWidths = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-none",
} as const;

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: keyof typeof containerWidths;
}

export function Container({ children, className, size = "lg", ...props }: ContainerProps) {
  return (
    <div
      className={classes("mx-auto w-full px-4 sm:px-6 lg:px-8", containerWidths[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

const columns = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;
const mediumColumns = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
} as const;
const largeColumns = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;
const gaps = { sm: "gap-3", md: "gap-6", lg: "gap-8" } as const;

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: keyof typeof columns;
  mdColumns?: keyof typeof mediumColumns;
  lgColumns?: keyof typeof largeColumns;
  gap?: keyof typeof gaps;
}

export function Grid({
  children,
  className,
  columns: base = 1,
  mdColumns = 2,
  lgColumns,
  gap = "md",
  ...props
}: GridProps) {
  return (
    <div
      className={classes(
        "grid",
        columns[base],
        mediumColumns[mdColumns],
        lgColumns && largeColumns[lgColumns],
        gaps[gap],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
