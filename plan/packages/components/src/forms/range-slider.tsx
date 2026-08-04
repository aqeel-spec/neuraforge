'use client';

import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

export interface RangeSliderProps {
  label: string;
  name: string;
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  label,
  name,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
}: RangeSliderProps) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const trackRef = useRef<HTMLDivElement>(null);

  const initialValue: [number, number] = value ?? defaultValue ?? [min, max];
  const [internalValue, setInternalValue] = useState<[number, number]>(initialValue);

  const current = value ?? internalValue;

  const clamp = (val: number): number => Math.min(max, Math.max(min, val));

  const roundToStep = (val: number): number => {
    const rounded = Math.round((val - min) / step) * step + min;
    return clamp(Number(rounded.toFixed(10)));
  };

  const updateValue = useCallback(
    (newValue: [number, number]) => {
      const sorted: [number, number] =
        newValue[0] <= newValue[1] ? newValue : [newValue[1], newValue[0]];
      if (!value) {
        setInternalValue(sorted);
      }
      onChange?.(sorted);
    },
    [value, onChange],
  );

  const getPercentage = (val: number): number => ((val - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return roundToStep(min + fraction * (max - min));
    },
    [min, max, step],
  );

  const handleThumbKeyDown = (index: 0 | 1) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let newVal = current[index];
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        newVal = clamp(current[index] + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        newVal = clamp(current[index] - step);
        break;
      case "Home":
        event.preventDefault();
        newVal = min;
        break;
      case "End":
        event.preventDefault();
        newVal = max;
        break;
      default:
        return;
    }
    const next: [number, number] = [...current] as [number, number];
    next[index] = newVal;
    updateValue(next);
  };

  const handleTrackMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    const newVal = getValueFromPosition(event.clientX);
    // Determine which thumb is closer
    const distToLow = Math.abs(newVal - current[0]);
    const distToHigh = Math.abs(newVal - current[1]);
    const index: 0 | 1 = distToLow <= distToHigh ? 0 : 1;
    const next: [number, number] = [...current] as [number, number];
    next[index] = newVal;
    updateValue(next);

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const moveVal = getValueFromPosition(e.clientX);
      const moveNext: [number, number] = [...(value ?? internalValue)] as [number, number];
      moveNext[index] = moveVal;
      updateValue(moveNext);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const lowPct = getPercentage(current[0]);
  const highPct = getPercentage(current[1]);

  return (
    <div className={className}>
      <label id={labelId} className="block text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </label>
      <input type="hidden" name={`${name}-min`} value={current[0]} />
      <input type="hidden" name={`${name}-max`} value={current[1]} />
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">{current[0]}</span>
        <div
          ref={trackRef}
          className="relative h-2 flex-1 cursor-pointer rounded-full bg-slate-200 dark:bg-zinc-700"
          onMouseDown={handleTrackMouseDown}
          role="presentation"
        >
          {/* Active range */}
          <div
            className="absolute h-full rounded-full bg-indigo-600"
            style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
          />
          {/* Low thumb */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-labelledby={labelId}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current[0]}
            aria-disabled={disabled}
            aria-label={`${label} minimum`}
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-600 bg-white dark:bg-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            style={{ left: `${lowPct}%` }}
            onKeyDown={handleThumbKeyDown(0)}
          />
          {/* High thumb */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-labelledby={labelId}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current[1]}
            aria-disabled={disabled}
            aria-label={`${label} maximum`}
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-600 bg-white dark:bg-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            style={{ left: `${highPct}%` }}
            onKeyDown={handleThumbKeyDown(1)}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">{current[1]}</span>
      </div>
    </div>
  );
}
