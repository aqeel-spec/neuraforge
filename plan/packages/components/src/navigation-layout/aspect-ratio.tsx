import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "./shared.js";

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width-to-height ratio (e.g. 16/9, 4/3, 1). */
  ratio: number;
  children: ReactNode;
  className?: string;
}

export function AspectRatio({ ratio, children, className, style, ...props }: AspectRatioProps) {
  return (
    <div
      className={classes("relative w-full overflow-hidden", className)}
      style={{ ...style, paddingBottom: `${(1 / ratio) * 100}%` }}
      {...props}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
