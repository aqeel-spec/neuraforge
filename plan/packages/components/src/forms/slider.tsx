'use client';

import { useId, useState } from "react";
import type { ChangeEvent } from "react";

export interface SliderProps {
  label: string;
  name: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export function Slider({
  label,
  name,
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue,
  defaultValue,
  onChange,
  disabled = false,
}: SliderProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-slider`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? min);
  const currentValue = isControlled ? controlledValue : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </label>
        <output htmlFor={inputId} className="text-sm tabular-nums text-slate-600 dark:text-zinc-300">
          {currentValue}
        </output>
      </div>
      <input
        id={inputId}
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-zinc-700 accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
