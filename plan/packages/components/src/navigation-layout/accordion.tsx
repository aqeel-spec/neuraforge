'use client';

import { type KeyboardEvent, type ReactNode, useCallback, useState } from "react";
import { classes, focusRing } from "./shared.js";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** When true, multiple items can be open simultaneously. */
  multiple?: boolean;
  className?: string;
}

export function Accordion({ items, multiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of items) {
      if (item.defaultOpen) initial.add(item.id);
    }
    return initial;
  });

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!multiple) next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [multiple],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(id);
      }
    },
    [toggle],
  );

  return (
    <div
      className={classes("divide-y divide-slate-200 rounded-xl border border-slate-200", className)}
    >
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className="overflow-hidden first:rounded-t-xl last:rounded-b-xl">
            <h3>
              <button
                type="button"
                id={`accordion-trigger-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={classes(
                  "flex w-full items-center justify-between bg-white px-5 py-4 text-left text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50",
                  focusRing,
                )}
              >
                <span>{item.title}</span>
                <svg
                  aria-hidden="true"
                  className={classes(
                    "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              hidden={!isOpen}
              className={classes(
                "overflow-hidden bg-white transition-all duration-200",
                isOpen ? "block" : "hidden",
              )}
            >
              <div className="px-5 pb-4 text-sm leading-6 text-slate-600">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
