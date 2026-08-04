'use client';

import { useId, useRef, useState, useCallback, useEffect } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

export interface DatePickerProps {
  label: string;
  name: string;
  value?: string; // ISO date string YYYY-MM-DD
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split("-");
  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  if (parts.length !== 3 || !p0 || !p1 || !p2) return null;
  const year = parseInt(p0, 10);
  const month = parseInt(p1, 10) - 1;
  const day = parseInt(p2, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  label,
  name,
  value,
  onChange,
  min,
  max,
  disabled = false,
  error,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const dialogId = `${generatedId}-dialog`;
  const errorId = `${generatedId}-error`;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value ? parseDate(value) : null;
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [focusDay, setFocusDay] = useState(parsed?.day ?? today.getDate());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const closeCalendar = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeCalendar();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, closeCalendar]);

  function isDateDisabled(year: number, month: number, day: number): boolean {
    const dateStr = formatDate(year, month, day);
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  }

  function selectDate(day: number) {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    const dateStr = formatDate(viewYear, viewMonth, day);
    onChange?.(dateStr);
    closeCalendar();
  }

  function navigateMonth(delta: number) {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
    const maxDay = getDaysInMonth(newYear, newMonth);
    if (focusDay > maxDay) setFocusDay(maxDay);
  }

  function handleCalendarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowLeft": {
        event.preventDefault();
        if (focusDay > 1) setFocusDay(focusDay - 1);
        else navigateMonth(-1);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (focusDay < daysInMonth) setFocusDay(focusDay + 1);
        else {
          navigateMonth(1);
          setFocusDay(1);
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (focusDay > 7) setFocusDay(focusDay - 7);
        else navigateMonth(-1);
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        if (focusDay + 7 <= daysInMonth) setFocusDay(focusDay + 7);
        else navigateMonth(1);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        selectDate(focusDay);
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeCalendar();
        break;
      }
    }
  }

  function handleDayClick(event: MouseEvent<HTMLButtonElement>, day: number) {
    event.preventDefault();
    selectDate(day);
  }

  function handleToggle() {
    if (disabled) return;
    if (!isOpen && parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setFocusDay(parsed.day);
    }
    setIsOpen((prev) => !prev);
  }

  const displayValue = parsed ? `${MONTH_NAMES[parsed.month]} ${parsed.day}, ${parsed.year}` : "";

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="relative">
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-950 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${error ? "border-red-600" : ""}`}
        >
          <span className={displayValue ? "text-slate-950" : "text-slate-400"}>
            {displayValue || "Select a date"}
          </span>
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        {isOpen ? (
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label={`Choose date: ${MONTH_NAMES[viewMonth]} ${viewYear}`}
            className="absolute z-10 mt-1 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg"
            onKeyDown={handleCalendarKeyDown}
          >
            {/* Month navigation */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                aria-label="Previous month"
                className="rounded p-1 text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                aria-label="Next month"
                className="rounded p-1 text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {/* Day names */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {DAY_NAMES.map((day) => (
                <span key={day} className="text-xs font-medium text-slate-500">
                  {day}
                </span>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label="Calendar">
              {Array.from({ length: firstDay }, (_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = formatDate(viewYear, viewMonth, day);
                const isSelected = value === dateStr;
                const isToday =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear();
                const isFocused = day === focusDay;
                const dayDisabled = isDateDisabled(viewYear, viewMonth, day);
                return (
                  <button
                    key={day}
                    type="button"
                    tabIndex={isFocused ? 0 : -1}
                    disabled={dayDisabled}
                    onClick={(e) => handleDayClick(e, day)}
                    aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                    aria-pressed={isSelected}
                    className={`h-8 w-8 rounded text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:text-slate-300 ${
                      isSelected
                        ? "bg-indigo-600 font-medium text-white"
                        : isToday
                          ? "bg-indigo-50 font-medium text-indigo-600"
                          : "text-slate-900 hover:bg-slate-100"
                    } ${isFocused && !isSelected ? "ring-2 ring-indigo-400" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
