import { useId, useState } from "react";
import type { ChangeEvent } from "react";

export interface ColorPickerProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (color: string) => void;
  presets?: string[];
}

const defaultPresets = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#000000",
];

export function ColorPicker({
  label,
  name,
  value: controlledValue,
  onChange,
  presets = defaultPresets,
}: ColorPickerProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-color`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState("#3b82f6");
  const currentValue = isControlled ? controlledValue : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function handlePresetClick(color: string) {
    if (!isControlled) {
      setInternalValue(color);
    }
    onChange?.(color);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="color"
          name={name}
          value={currentValue}
          onChange={handleChange}
          className="h-10 w-10 cursor-pointer rounded-lg border border-slate-300 p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        />
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={currentValue}
          onChange={handleChange}
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none transition-colors focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        />
      </div>
      {presets.length > 0 ? (
        <div role="group" aria-label="Color presets" className="flex flex-wrap gap-1.5">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Select color ${color}`}
              onClick={() => handlePresetClick(color)}
              style={{ backgroundColor: color }}
              className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                currentValue.toLowerCase() === color.toLowerCase()
                  ? "border-slate-900 shadow-sm"
                  : "border-transparent"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
