'use client';

import { useId, useRef, useState, useCallback, useEffect } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const triggerClasses =
  "flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function Select({
  label,
  name,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  error,
  value,
  onChange,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;
  const labelId = `${generatedId}-label`;
  const errorId = `${generatedId}-error`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      closeListbox();
    },
    [onChange, closeListbox],
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !listboxRef.current?.contains(event.target as Node)
      ) {
        closeListbox();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, closeListbox]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => {
            const next = event.key === "ArrowDown" ? prev + 1 : prev - 1;
            if (next < 0) return options.length - 1;
            if (next >= options.length) return 0;
            return next;
          });
        }
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (isOpen && activeIndex >= 0) {
          const option = options[activeIndex];
          if (option) selectOption(option.value);
        } else {
          setIsOpen(true);
          setActiveIndex(0);
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeListbox();
        break;
      }
      case "Home": {
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      }
      case "End": {
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      }
    }
  }

  function handleOptionClick(event: MouseEvent<HTMLLIElement>, optionValue: string) {
    event.preventDefault();
    selectOption(optionValue);
  }

  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-sm font-medium text-slate-900">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {/* Hidden native input for form submission */}
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-labelledby={labelId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required}
          disabled={disabled}
          className={`${triggerClasses} ${error ? "border-red-600" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={selectedOption ? "text-slate-950" : "text-slate-400"}>
            {selectedOption?.label ?? placeholder}
          </span>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${generatedId}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-indigo-600 text-white"
                    : "text-slate-950 hover:bg-slate-100"
                } ${option.value === value ? "font-medium" : ""}`}
                onClick={(e) => handleOptionClick(e, option.value)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
