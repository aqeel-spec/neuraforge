'use client';

import React, { useState } from "react";
import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
  rowHeader?: boolean;
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  emptyMessage?: string;
  className?: string;
}

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = "No data available.",
  className,
}: DataTableProps<Row>) {
  return (
    <div
      className={joinClasses(
        "w-full overflow-x-auto rounded-xl border border-slate-200",
        className,
      )}
      data-capability-fallback="horizontal-scroll"
    >
      <table className="min-w-full border-collapse bg-white text-sm text-slate-700">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-slate-950 supports-[position:sticky]:sticky supports-[position:sticky]:top-0">
          <tr>
            {columns.map((column) => (
              <th
                className={joinClasses(
                  "whitespace-nowrap px-4 py-3 font-semibold",
                  alignmentClasses[column.align ?? "left"],
                )}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-8 text-center text-slate-500"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr className="hover:bg-slate-50" key={getRowKey(row)}>
                {columns.map((column) => {
                  const Cell = column.rowHeader === true ? "th" : "td";
                  return (
                    <Cell
                      className={joinClasses(
                        "px-4 py-3",
                        column.rowHeader === true && "font-medium text-slate-950",
                        alignmentClasses[column.align ?? "left"],
                      )}
                      key={column.key}
                      {...(column.rowHeader === true ? { scope: "row" as const } : {})}
                    >
                      {column.cell(row)}
                    </Cell>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface StatProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  className?: string;
}

const trendClasses = {
  up: "text-emerald-700",
  down: "text-rose-700",
  neutral: "text-slate-600",
} as const;

export function Stat({ label, value, description, trend, className }: StatProps) {
  return (
    <article
      className={joinClasses(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {(trend !== undefined || description !== undefined) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {trend !== undefined && (
            <span className={joinClasses("font-medium", trendClasses[trend.direction])}>
              <span aria-hidden="true">
                {trend.direction === "up" ? "↑ " : trend.direction === "down" ? "↓ " : "→ "}
              </span>
              {trend.label}
            </span>
          )}
          {description !== undefined && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </article>
  );
}

export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  className?: string;
}

const badgeClasses = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        badgeClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface AvatarProps {
  name: string;
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase();

export function Avatar({ name, src, alt, size = "md", className }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const showImage = src !== undefined && src !== "" && failedSource !== src;
  const sharedClasses = joinClasses(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-200",
    avatarSizes[size],
    className,
  );

  if (showImage) {
    return (
      <img
        alt={alt ?? name}
        className={joinClasses(sharedClasses, "object-cover")}
        onError={() => {
          setFailedSource(src);
        }}
        src={src}
      />
    );
  }

  return (
    <span aria-label={name} className={sharedClasses} role="img">
      <span aria-hidden="true">{initialsFor(name) || "?"}</span>
    </span>
  );
}

export interface AvatarGroupProps {
  avatars: readonly { name: string; src?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = "md", className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div
      className={joinClasses("flex -space-x-2", className)}
      role="group"
      aria-label={`${String(avatars.length)} users`}
    >
      {visible.map((avatar) => (
        <Avatar
          key={avatar.name}
          name={avatar.name}
          {...(avatar.src !== undefined ? { src: avatar.src } : {})}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <span
          aria-label={`${String(overflow)} more users`}
          className={joinClasses(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 ring-2 ring-white",
            avatarSizes[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export type TagVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  variant?: TagVariant;
  className?: string;
}

const tagClasses: Record<TagVariant, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  primary: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function Tag({ children, onRemove, variant = "default", className }: TagProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tagClasses[variant],
        className,
      )}
    >
      {children}
      {onRemove !== undefined && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
          className="ml-0.5 inline-flex size-4 items-center justify-center rounded-sm outline-none hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-current"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  className?: string;
}

const timelineDotClasses = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
} as const;

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol
      className={joinClasses("relative border-l border-slate-200", className)}
      aria-label="Timeline"
    >
      {items.map((item) => (
        <li key={item.id} className="mb-6 ml-6 last:mb-0">
          <span
            aria-hidden="true"
            className={joinClasses(
              "absolute -left-1.5 mt-1.5 size-3 rounded-full ring-4 ring-white",
              timelineDotClasses[item.variant ?? "default"],
            )}
          />
          {item.icon !== undefined && (
            <span aria-hidden="true" className="mb-1 inline-flex text-slate-500">
              {item.icon}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
          {item.date !== undefined && <time className="text-xs text-slate-500">{item.date}</time>}
          {item.description !== undefined && (
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
}

const tooltipPositionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

export function Tooltip({
  content,
  children,
  side = "top",
  delayMs = 300,
  className,
}: TooltipProps) {
  return (
    <span
      className={joinClasses("group relative inline-flex", className)}
      style={{ "--tooltip-delay": `${String(delayMs)}ms` } as React.CSSProperties}
    >
      {children}
      <span
        role="tooltip"
        className={joinClasses(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:delay-[var(--tooltip-delay)] group-hover:block group-focus-within:delay-[var(--tooltip-delay)] group-focus-within:block",
          tooltipPositionClasses[side],
        )}
      >
        {content}
      </span>
    </span>
  );
}

export interface KBDProps {
  keys: string[];
  className?: string;
}

export function KBD({ keys, className }: KBDProps) {
  return (
    <span
      className={joinClasses("inline-flex items-center gap-0.5", className)}
      aria-label={keys.join(" + ")}
    >
      {keys.map((key, index) => (
        <kbd
          key={`${key}-${String(index)}`}
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export const dataDisplayComponentIds = [
  "data-table",
  "stat",
  "badge",
  "avatar",
  "avatar-group",
  "tag",
  "timeline",
  "tooltip",
  "kbd",
] as const;
