'use client';

import { useId, useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";

export interface TextFieldProps extends Omit<ComponentPropsWithoutRef<"input">, "children"> {
  label: string;
  description?: string;
  error?: string;
}

const inputClasses =
  "block w-full rounded-md border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-950 dark:text-white shadow-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-400";

export function TextField({
  label,
  description,
  error,
  id: providedId,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onInvalid,
  onInput,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = `${id}-error`;
  const [nativeError, setNativeError] = useState("");
  const resolvedError = error ?? nativeError;
  const describedBy =
    [ariaDescribedBy, descriptionId, resolvedError ? errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  function handleInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setNativeError(event.currentTarget.validationMessage);
    onInvalid?.(event);
  }
  function handleInput(event: FormEvent<HTMLInputElement>) {
    if (nativeError) setNativeError(event.currentTarget.validationMessage);
    onInput?.(event);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 dark:text-white">
        {label}
        {inputProps.required ? (
          <span aria-hidden="true" className="ml-1 text-red-600 dark:text-red-400">
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p id={descriptionId} className="text-sm text-slate-600 dark:text-zinc-300">
          {description}
        </p>
      ) : null}
      <input
        {...inputProps}
        id={id}
        className={`${inputClasses} ${resolvedError ? "border-red-600" : ""} ${className ?? ""}`}
        aria-describedby={describedBy}
        aria-invalid={resolvedError ? true : ariaInvalid}
        onInvalid={handleInvalid}
        onInput={handleInput}
      />
      {resolvedError ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {resolvedError}
        </p>
      ) : null}
    </div>
  );
}
