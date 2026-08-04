import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2";

export function classes(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export interface NavigationItem {
  label: string;
  href: string;
  current?: boolean;
  disabled?: boolean;
}

export interface ActionLink extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  label: string;
}

export interface CommonProps {
  className?: string;
}

export interface ContentProps extends CommonProps, Omit<HTMLAttributes<HTMLElement>, "className"> {
  children: ReactNode;
}
