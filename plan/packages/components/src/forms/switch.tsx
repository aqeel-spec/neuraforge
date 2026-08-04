'use client';

import { useId, useState } from "react";

export interface SwitchProps {
  label: string;
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({
  label,
  name,
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
}: SwitchProps) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;

  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  function handleToggle() {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onChange?.(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={isChecked ? "on" : "off"} />
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          isChecked ? "bg-indigo-600" : "bg-slate-200 dark:bg-zinc-700"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow-sm ring-0 transition-transform ${
            isChecked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span id={labelId} className="text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </span>
    </div>
  );
}
