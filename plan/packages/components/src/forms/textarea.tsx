'use client';

import { useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

export interface TextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  error?: string;
  description?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const textareaClasses =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 resize-y";

export function Textarea({
  label,
  name,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  maxLength,
  error,
  description,
  value,
  defaultValue,
  onChange,
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = `${generatedId}-textarea`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const errorId = `${generatedId}-error`;

  const [nativeError, setNativeError] = useState("");
  const [charCount, setCharCount] = useState((value ?? defaultValue ?? "").length);
  const resolvedError = error ?? nativeError;

  const describedBy =
    [descriptionId, resolvedError ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const newValue = event.target.value;
    setCharCount(newValue.length);
    if (nativeError) setNativeError(event.target.validationMessage);
    onChange?.(newValue);
  }

  function handleInvalid(event: FormEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setNativeError(event.currentTarget.validationMessage);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-slate-900">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p id={descriptionId} className="text-sm text-slate-600">
          {description}
        </p>
      ) : null}
      <textarea
        id={textareaId}
        name={name}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onInvalid={handleInvalid}
        aria-describedby={describedBy}
        aria-invalid={resolvedError ? true : undefined}
        className={`${textareaClasses} ${resolvedError ? "border-red-600" : ""}`}
      />
      <div className="flex items-center justify-between">
        {resolvedError ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
            {resolvedError}
          </p>
        ) : (
          <span />
        )}
        {maxLength ? (
          <p className="text-xs text-slate-500" aria-live="polite">
            {charCount}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}
