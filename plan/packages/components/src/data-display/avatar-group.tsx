'use client';

import { useState } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

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

/**
 * @deprecated Use `Avatar` from `primitives/avatar` instead for new code.
 * This is kept for AvatarGroup compatibility.
 */
export function Avatar({ name, src, alt, size = "md", className }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const showImage = src !== undefined && src !== "" && failedSource !== src;
  const sharedClasses = joinClasses(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900 font-semibold text-indigo-800 dark:text-indigo-200 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-700",
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
          className="ring-2 ring-white dark:ring-slate-900"
        />
      ))}
      {overflow > 0 && (
        <span
          aria-label={`${String(overflow)} more users`}
          className={joinClasses(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900",
            avatarSizes[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
