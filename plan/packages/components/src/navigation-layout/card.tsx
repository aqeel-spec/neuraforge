import type { HTMLAttributes, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  href?: string;
}

export function Card({ title, description, media, footer, href, className, ...props }: CardProps) {
  return (
    <article
      className={classes(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {media ? <div className="aspect-[16/9] overflow-hidden bg-slate-100">{media}</div> : null}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-950">
          {href ? (
            <a
              className={classes("rounded-sm after:absolute after:inset-0", focusRing)}
              href={href}
            >
              {title}
            </a>
          ) : (
            title
          )}
        </h3>
        {description ? (
          <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
        ) : null}
        {footer ? (
          <div className="relative z-10 mt-5 border-t border-slate-100 pt-4">{footer}</div>
        ) : null}
      </div>
    </article>
  );
}
