'use client';

import { useId, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

export interface SearchFilter {
  id: string;
  label: string;
  active: boolean;
}

export interface SearchInputProps {
  /** Current search value */
  value?: string;
  /** Called when the input value changes */
  onChange?: (value: string) => void;
  /** Called when the user presses Enter or submits the search */
  onSearch?: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional filter toggles displayed below the input */
  filters?: SearchFilter[];
  /** Called when a filter toggle is clicked */
  onFilterChange?: (id: string, active: boolean) => void;
  /** Show loading spinner in place of search icon */
  loading?: boolean;
  /** Show clear button when input has a value */
  clearable?: boolean;
  /** Additional CSS class names for the wrapper */
  className?: string;
  /** Accessible label for the search input */
  label?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Search...",
  filters,
  onFilterChange,
  loading = false,
  clearable = true,
  className,
  label = "Search",
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-search`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const currentValue = isControlled ? controlledValue : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch?.(currentValue);
    }
  }

  function handleClear() {
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    onSearch?.("");
  }

  const hasValue = currentValue.length > 0;

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-900 dark:text-white"
      >
        {label}
      </label>
      <div className="relative">
        {/* Search icon or loading spinner */}
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin text-slate-400 dark:text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-slate-400 dark:text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          )}
        </span>

        <input
          id={inputId}
          type="search"
          role="searchbox"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          className={[
            "block w-full rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 py-2 pl-10 text-sm text-slate-900 dark:text-white shadow-sm outline-none transition-colors",
            "placeholder:text-slate-400 dark:placeholder:text-zinc-500",
            "focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            clearable && hasValue ? "pr-9" : "pr-3",
          ].join(" ")}
        />

        {/* Clear button */}
        {clearable && hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 outline-none focus-visible:text-indigo-600 dark:focus-visible:text-indigo-400"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Filter toggles */}
      {filters && filters.length > 0 ? (
        <div role="group" aria-label="Search filters" className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange?.(filter.id, !filter.active)}
              aria-pressed={filter.active}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
                filter.active
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-600",
              ].join(" ")}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
