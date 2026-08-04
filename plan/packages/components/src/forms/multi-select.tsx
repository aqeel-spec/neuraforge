import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label: string;
  name: string;
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Select options…",
  max,
  disabled = false,
  className,
}: MultiSelectProps) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const listboxId = `${generatedId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const [internalValue, setInternalValue] = useState<string[]>(value ?? []);
  const selected = value ?? internalValue;

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));
  const availableOptions = options.filter((opt) => !selected.includes(opt.value));
  const isAtMax = max != null && selected.length >= max;

  const closeListbox = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const updateValue = useCallback(
    (newValues: string[]) => {
      if (!value) setInternalValue(newValues);
      onChange?.(newValues);
    },
    [value, onChange],
  );

  const addOption = useCallback(
    (optionValue: string) => {
      if (isAtMax) return;
      const next = [...selected, optionValue];
      updateValue(next);
    },
    [selected, isAtMax, updateValue],
  );

  const removeOption = useCallback(
    (optionValue: string) => {
      const next = selected.filter((v) => v !== optionValue);
      updateValue(next);
    },
    [selected, updateValue],
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        !containerRef.current?.contains(event.target as Node) &&
        !listboxRef.current?.contains(event.target as Node)
      ) {
        closeListbox();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, closeListbox]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => (prev + 1 >= availableOptions.length ? 0 : prev + 1));
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (isOpen) {
          setActiveIndex((prev) => (prev - 1 < 0 ? availableOptions.length - 1 : prev - 1));
        }
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (isOpen && activeIndex >= 0) {
          const option = availableOptions[activeIndex];
          if (option) addOption(option.value);
        } else if (!isOpen) {
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
    }
  }

  return (
    <div className={className}>
      <label id={labelId} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      {/* Hidden inputs for form submission */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <div className="relative mt-1.5">
        <div
          ref={containerRef}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined
          }
          aria-disabled={disabled}
          className="flex min-h-[2.5rem] w-full flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
        >
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
              >
                {opt.label}
                <button
                  type="button"
                  aria-label={`Remove ${opt.label}`}
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(opt.value);
                  }}
                >
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
        </div>
        {isOpen && availableOptions.length > 0 ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            aria-multiselectable="true"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {availableOptions.map((option, index) => (
              <li
                key={option.value}
                id={`${generatedId}-option-${index}`}
                role="option"
                aria-selected={false}
                aria-disabled={isAtMax}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-indigo-600 text-white"
                    : "text-slate-950 hover:bg-slate-100"
                } ${isAtMax ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={() => addOption(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {max != null ? (
        <p className="mt-1 text-xs text-slate-500">
          {selected.length}/{max} selected
        </p>
      ) : null}
    </div>
  );
}
