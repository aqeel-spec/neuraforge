import { useId } from "react";
import type { ChangeEvent } from "react";

export interface CheckboxProps {
  label: string;
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export function Checkbox({
  label,
  name,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  error,
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-checkbox`;
  const errorId = `${generatedId}-error`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.checked);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="checkbox"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <label htmlFor={inputId} className="text-sm font-medium text-slate-900">
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
