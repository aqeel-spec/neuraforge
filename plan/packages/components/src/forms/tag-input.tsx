'use client';

import { useId, useState, useRef, useCallback } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";

export interface TagInputProps {
  /** Current list of tags */
  tags: string[];
  /** Called when the tag list changes */
  onChange: (tags: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Allow duplicate tags */
  allowDuplicates?: boolean;
  /** Character(s) that trigger tag creation */
  separator?: string;
  /** Custom validation function for new tags */
  validateTag?: (tag: string) => boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Additional CSS class names for the wrapper */
  className?: string;
  /** Accessible label */
  label?: string;
  /** Error message to display below the input */
  error?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag...",
  maxTags,
  allowDuplicates = false,
  separator = ",",
  validateTag,
  disabled = false,
  className,
  label = "Tags",
  error,
}: TagInputProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-tag-input`;
  const errorId = `${generatedId}-tag-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (maxTags !== undefined && tags.length >= maxTags) return;
      if (!allowDuplicates && tags.includes(trimmed)) return;
      if (validateTag && !validateTag(trimmed)) return;
      onChange([...tags, trimmed]);
    },
    [tags, onChange, maxTags, allowDuplicates, validateTag],
  );

  const removeTag = useCallback(
    (index: number) => {
      const next = tags.filter((_, i) => i !== index);
      onChange(next);
    },
    [tags, onChange],
  );

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const val = event.target.value;
    // Check if separator was typed
    if (val.includes(separator)) {
      const parts = val.split(separator);
      // Add all parts except the last (which is after the separator)
      for (const part of parts.slice(0, -1)) {
        addTag(part);
      }
      setInputValue(parts[parts.length - 1] ?? "");
    } else {
      setInputValue(val);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(inputValue);
      setInputValue("");
    } else if (event.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  function handleWrapperClick() {
    inputRef.current?.focus();
  }

  const hasError = Boolean(error);
  const isAtMax = maxTags !== undefined && tags.length >= maxTags;

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-900 dark:text-slate-100"
      >
        {label}
      </label>
      <div
        onClick={handleWrapperClick}
        className={[
          "flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-colors",
          "focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2",
          "dark:bg-slate-900",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-text",
          hasError
            ? "border-red-600 dark:border-red-500"
            : "border-slate-300 dark:border-slate-600",
        ].join(" ")}
      >
        {/* Tag chips */}
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          >
            {tag}
            {!disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                aria-label={`Remove tag ${tag}`}
                className="ml-0.5 inline-flex items-center rounded-sm text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-800 dark:hover:text-indigo-100"
              >
                <svg
                  className="h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
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
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isAtMax}
          placeholder={tags.length === 0 ? placeholder : isAtMax ? "" : placeholder}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Error message */}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
