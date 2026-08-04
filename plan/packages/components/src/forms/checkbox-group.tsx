'use client';

import { useId } from "react";
import type { ChangeEvent } from "react";

export interface CheckboxGroupOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps {
  legend: string;
  name: string;
  options: CheckboxGroupOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export function CheckboxGroup({
  legend,
  name,
  options,
  value = [],
  onChange,
  disabled = false,
  error,
}: CheckboxGroupProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const optionValue = event.target.value;
    const next = event.target.checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange?.(next);
  }

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="space-y-2"
    >
      <legend className="text-sm font-medium text-slate-900 dark:text-white">{legend}</legend>
      <div className="space-y-2">
        {options.map((option) => {
          const optionId = `${generatedId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-2">
              <input
                id={optionId}
                type="checkbox"
                name={name}
                value={option.value}
                checked={value.includes(option.value)}
                onChange={handleChange}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 dark:border-zinc-600 text-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label htmlFor={optionId} className="text-sm text-slate-900 dark:text-white">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
