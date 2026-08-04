import { classes } from "./shared.js";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
}: SeparatorProps) {
  const semanticProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "separator", "aria-orientation": orientation } as const);

  if (orientation === "vertical") {
    return (
      <span
        {...semanticProps}
        className={classes("inline-block h-full min-h-[1em] w-px bg-slate-200", className)}
      />
    );
  }

  return (
    <hr {...semanticProps} className={classes("h-px w-full border-0 bg-slate-200", className)} />
  );
}
