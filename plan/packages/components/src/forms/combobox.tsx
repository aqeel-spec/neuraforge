'use client';

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label: string;
  name: string;
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  creatable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Search…",
  creatable = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const labelId = `${generatedId}-label`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filtered = query
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const showCreateOption =
    creatable && query && !filtered.some((opt) => opt.label.toLowerCase() === query.toLowerCase());

  const totalItems = filtered.length + (showCreateOption ? 1 : 0);

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setQuery("");
      closeListbox();
    },
    [onChange, closeListbox],
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        !inputRef.current?.contains(event.target as Node) &&
        !listboxRef.current?.contains(event.target as Node)
      ) {
        closeListbox();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, closeListbox]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (isOpen && activeIndex >= 0) {
          if (activeIndex < filtered.length) {
            const option = filtered[activeIndex];
            if (option) selectOption(option.value);
          } else if (showCreateOption) {
            selectOption(query);
          }
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeListbox();
        break;
      }
    }
  }

  return (
    <div className={className}>
      <label id={labelId} htmlFor={inputId} className="block text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </label>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-labelledby={labelId}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined
          }
          disabled={disabled}
          placeholder={selectedOption?.label ?? placeholder}
          value={query}
          className="flex w-full items-center rounded-md border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-950 dark:text-white shadow-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-zinc-800"
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {isOpen && totalItems > 0 ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg"
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${generatedId}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-indigo-600 text-white"
                    : "text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700"
                } ${option.value === value ? "font-medium" : ""}`}
                onClick={() => selectOption(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            ))}
            {showCreateOption ? (
              <li
                id={`${generatedId}-option-${filtered.length}`}
                role="option"
                aria-selected={false}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  activeIndex === filtered.length
                    ? "bg-indigo-600 text-white"
                    : "text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700"
                }`}
                onClick={() => selectOption(query)}
                onMouseEnter={() => setActiveIndex(filtered.length)}
              >
                Create &ldquo;{query}&rdquo;
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
