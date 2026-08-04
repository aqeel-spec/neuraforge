'use client';

import { useCallback, useId, useState } from "react";
import type { ChangeEvent } from "react";

export type CountryCode =
  | "US"
  | "GB"
  | "PK"
  | "IN"
  | "AE"
  | "CA"
  | "AU"
  | "DE"
  | "FR"
  | "CN"
  | "JP"
  | "BR"
  | "SA"
  | "NG"
  | "ZA"
  | "MX"
  | "EG"
  | "TR"
  | "ID"
  | "BD";

interface CountryEntry {
  code: CountryCode;
  dialCode: string;
  flag: string;
  name: string;
}

const COUNTRIES: CountryEntry[] = [
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "PK", dialCode: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "China" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "TR", dialCode: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "ID", dialCode: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "BD", dialCode: "+880", flag: "🇧🇩", name: "Bangladesh" },
];

export interface PhoneInputProps {
  /** Full phone value including dial code, e.g. "+1 555-123-4567" */
  value?: string;
  /** Called with the full phone string when either country or number changes */
  onChange?: (value: string) => void;
  /** ISO 3166-1 alpha-2 country code for initial selection */
  defaultCountry?: CountryCode;
  /** Disables both the country selector and phone input */
  disabled?: boolean;
  /** Error message to display below the input */
  error?: string;
  /** Accessible label for the phone input group */
  label: string;
  /** Custom id for the phone input element */
  id?: string;
  /** Placeholder text for the phone number field */
  placeholder?: string;
  /** Additional CSS class names for the wrapper */
  className?: string;
}

/**
 * Loosely validates a phone number string.
 * Allows digits, spaces, dashes, parentheses, and dots.
 */
function isValidPhoneFormat(phone: string): boolean {
  return /^[\d\s\-().]*$/.test(phone);
}

export function PhoneInput({
  value: controlledValue,
  onChange,
  defaultCountry = "US",
  disabled = false,
  error,
  label,
  id: providedId,
  placeholder = "Phone number",
  className,
}: PhoneInputProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const selectId = `${id}-country`;

  const isControlled = controlledValue !== undefined;

  const [internalCountry, setInternalCountry] = useState<CountryCode>(defaultCountry);
  const [internalNumber, setInternalNumber] = useState("");

  // Derive country and number from controlled value if provided
  const getCountryFromValue = useCallback(
    (val: string): CountryCode => {
      // Find the longest matching dial code
      const sorted = [...COUNTRIES].sort(
        (a, b) => b.dialCode.length - a.dialCode.length,
      );
      for (const country of sorted) {
        if (val.startsWith(country.dialCode)) {
          return country.code;
        }
      }
      return defaultCountry;
    },
    [defaultCountry],
  );

  const getNumberFromValue = useCallback(
    (val: string): string => {
      const sorted = [...COUNTRIES].sort(
        (a, b) => b.dialCode.length - a.dialCode.length,
      );
      for (const country of sorted) {
        if (val.startsWith(country.dialCode)) {
          return val.slice(country.dialCode.length).trim();
        }
      }
      return val;
    },
    [],
  );

  const currentCountry = isControlled
    ? getCountryFromValue(controlledValue)
    : internalCountry;

  const currentNumber = isControlled
    ? getNumberFromValue(controlledValue)
    : internalNumber;

  const selectedEntry =
    COUNTRIES.find((c) => c.code === currentCountry) ?? COUNTRIES[0]!;

  function emitChange(country: CountryCode, number: string) {
    const entry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0]!;
    const dialCode = entry.dialCode;
    const full = number ? `${dialCode} ${number}` : dialCode;
    onChange?.(full);
  }

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCountry = event.target.value as CountryCode;
    if (!isControlled) {
      setInternalCountry(nextCountry);
    }
    emitChange(nextCountry, currentNumber);
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    // Only allow valid phone characters
    if (!isValidPhoneFormat(raw)) {
      return;
    }
    if (!isControlled) {
      setInternalNumber(raw);
    }
    emitChange(currentCountry, raw);
  }

  const hasError = Boolean(error);

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-900 dark:text-slate-100"
      >
        {label}
      </label>
      <div className="flex items-stretch gap-0">
        {/* Country code selector */}
        <select
          id={selectId}
          value={currentCountry}
          onChange={handleCountryChange}
          disabled={disabled}
          aria-label={`Country code for ${label}`}
          className={[
            "rounded-l-md border border-r-0 bg-slate-50 px-2 py-2 text-sm text-slate-900 outline-none transition-colors",
            "focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
            hasError
              ? "border-red-600 dark:border-red-500"
              : "border-slate-300 dark:border-slate-600",
          ].join(" ")}
        >
          {COUNTRIES.map((country) => (
            <option key={`${country.code}-${country.dialCode}`} value={country.code}>
              {country.flag} {country.dialCode} {country.code}
            </option>
          ))}
        </select>

        {/* Phone number input */}
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={currentNumber}
          onChange={handleNumberChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={[
            "block w-full rounded-r-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            "dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
            hasError
              ? "border-red-600 dark:border-red-500"
              : "border-slate-300 dark:border-slate-600",
          ].join(" ")}
        />
      </div>

      {/* Selected country indicator for screen readers */}
      <span className="sr-only" aria-live="polite">
        Selected country: {selectedEntry.name}, dial code {selectedEntry.dialCode}
      </span>

      {/* Error message */}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
