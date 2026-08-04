import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "./shared.js";

// `title` is omitted from the inherited DOM attributes because the component's `title` is
// rendered heading content (any ReactNode), not the string DOM tooltip attribute.
export interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
  align?: "left" | "center";
}

export function Hero({
  title,
  description,
  eyebrow,
  actions,
  visual,
  align = "left",
  className,
  ...props
}: HeroProps) {
  return (
    <section
      className={classes(
        "overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8",
        className,
      )}
      {...props}
    >
      <div
        className={classes(
          "mx-auto grid max-w-7xl items-center gap-12",
          visual ? "lg:grid-cols-2" : undefined,
          align === "center" && "text-center",
        )}
      >
        <div className={classes(align === "center" && "mx-auto max-w-3xl", !visual && "max-w-3xl")}>
          {eyebrow ? (
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-violet-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <div className="mt-6 text-pretty text-lg leading-8 text-slate-300">{description}</div>
          {actions ? (
            <div
              className={classes(
                "mt-8 flex flex-wrap gap-4",
                align === "center" && "justify-center",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
        {visual ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">{visual}</div>
        ) : null}
      </div>
    </section>
  );
}
