import type { ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface BottomNavItem {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Bottom navigation"
      className={classes(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-1 shadow-lg",
        className,
      )}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={classes(
            "flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
            focusRing,
            item.active ? "text-indigo-600" : "text-slate-500 hover:text-slate-900",
          )}
        >
          <span className="h-5 w-5" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
