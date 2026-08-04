import { useId } from "react";
import type { ChangeEvent } from "react";

export interface RadioGroupOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  legend: string;
  name: string;
  options: RadioGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
  error,
}: RadioGroupProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.value);
  }

  return (
    <fieldset
      disabled={disabled}
      role="radiogroup"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="space-y-2"
    >
      <legend className="text-sm font-medium text-slate-900">{legend}</legend>
      <div className="space-y-2">
        {options.map((option) => {
          const optionId = `${generatedId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-2">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={handleChange}
                disabled={disabled}
                className="h-4 w-4 border-slate-300 text-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label htmlFor={optionId} className="text-sm text-slate-900">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
