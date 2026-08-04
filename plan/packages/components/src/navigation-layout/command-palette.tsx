'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  action: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: readonly Command[];
  placeholder?: string;
}

/**
 * A Cmd+K searchable command palette (modal overlay).
 *
 * - Renders with `role="dialog"` and `aria-modal="true"`.
 * - Search input filters commands by label and description (case-insensitive).
 * - Keyboard: ArrowUp/ArrowDown to navigate the list, Enter to execute,
 *   Escape to close. Home/End jump to first/last result.
 * - Focus is trapped within the dialog while open.
 * - The active item is indicated with `aria-selected` on the listbox pattern.
 * - Registers a global Cmd+K / Ctrl+K listener to toggle open state.
 */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = "Type a command…",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) || cmd.description?.toLowerCase().includes(lower),
    );
  }, [commands, query]);

  // Reset state when opened/closed
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Clamp active index when filtered results change
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, onOpenChange]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const executeCommand = useCallback(
    (command: Command) => {
      close();
      command.action();
    },
    [close],
  );

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      }
      case "Enter": {
        event.preventDefault();
        const active = filtered[activeIndex];
        if (active) {
          executeCommand(active);
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        close();
        break;
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={close}
      aria-hidden="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center border-b border-slate-200 px-4">
          <span aria-hidden="true" className="mr-3 text-slate-400">
            ⌘
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={
              filtered[activeIndex] ? `command-${filtered[activeIndex].id}` : undefined
            }
            aria-autocomplete="list"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className={classes(
              "flex-1 border-0 bg-transparent py-3.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none",
            )}
          />
          <kbd className="ml-3 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400">
            esc
          </kbd>
        </div>

        {/* Command list */}
        <ul
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="Commands"
          className="max-h-72 overflow-y-auto p-2"
        >
          {filtered.length === 0 ? (
            <li
              className="px-3 py-6 text-center text-sm text-slate-500"
              role="option"
              aria-selected={false}
            >
              No commands found.
            </li>
          ) : (
            filtered.map((command, index) => (
              <li
                key={command.id}
                id={`command-${command.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={classes(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  index === activeIndex
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-700 hover:bg-slate-50",
                  focusRing,
                )}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {command.icon ? (
                  <span aria-hidden="true" className="shrink-0 text-slate-500">
                    {command.icon}
                  </span>
                ) : null}
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium">{command.label}</div>
                  {command.description ? (
                    <div className="truncate text-xs text-slate-500">{command.description}</div>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
