'use client';

import { useCallback, useRef } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value = "",
  onChange,
  disabled = false,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  const updateValue = useCallback(
    (index: number, char: string) => {
      const chars = value.padEnd(length, "").split("");
      chars[index] = char;
      const next = chars.join("").trim();
      onChange?.(next);
    },
    [value, length, onChange],
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    const input = event.target.value;
    const char = input.replace(/\D/g, "").slice(-1);
    updateValue(index, char);
    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace") {
      event.preventDefault();
      updateValue(index, "");
      if (index > 0) {
        focusInput(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (event.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange?.(pasted);
      const targetIndex = Math.min(pasted.length, length - 1);
      focusInput(targetIndex);
    }
  }

  return (
    <div
      role="group"
      aria-label="One-time password"
      className={`flex items-center gap-2 ${className ?? ""}`}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className="h-12 w-10 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-center text-lg font-semibold text-slate-900 dark:text-white outline-none transition-colors focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      ))}
    </div>
  );
}
