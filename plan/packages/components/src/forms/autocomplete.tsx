import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export interface AutocompleteProps {
  label: string;
  name: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function Autocomplete({
  label,
  name,
  options,
  value: controlledValue,
  onChange,
  placeholder,
}: AutocompleteProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const currentValue = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(currentValue.toLowerCase()),
  );

  const updateValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const selectOption = useCallback(
    (option: string) => {
      updateValue(option);
      setOpen(false);
      setActiveIndex(-1);
    },
    [updateValue],
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        selectOption(filtered[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        name={name}
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined
        }
        autoComplete="off"
        placeholder={placeholder}
        value={currentValue}
        onChange={(e) => {
          updateValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((option, index) => (
            <li
              key={option}
              id={`${generatedId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => selectOption(option)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex
                  ? "bg-indigo-50 text-indigo-900"
                  : "text-slate-900 hover:bg-slate-50"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
