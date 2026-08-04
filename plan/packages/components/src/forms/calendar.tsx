'use client';

import { useCallback, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  className?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
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
] as const;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateDisabled(date: Date, min?: Date, max?: Date): boolean {
  if (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return true;
  if (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return true;
  return false;
}

export function Calendar({ value, onChange, min, max, className }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => value ?? today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const result: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      result.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(new Date(year, month, d));
    }
    return result;
  }, [year, month, startDay, daysInMonth]);

  const goToPrevMonth = useCallback(() => {
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const handleDayClick = useCallback(
    (date: Date) => {
      if (isDateDisabled(date, min, max)) return;
      onChange?.(date);
    },
    [onChange, min, max],
  );

  const handleDayKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleDayClick(date);
      }
    },
    [handleDayClick],
  );

  return (
    <div
      className={`w-72 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm ${className ?? ""}`}
      role="application"
      aria-label="Calendar"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="Previous month"
          className="rounded-md p-1 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="rounded-md p-1 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((day) => (
          <span key={day} className="py-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            {day}
          </span>
        ))}
      </div>
      {/* Day grid */}
      <div
        className="grid grid-cols-7 text-center"
        role="grid"
        aria-label={`${MONTHS[month]} ${year}`}
      >
        {days.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} />;
          }
          const isSelected = value ? isSameDay(date, value) : false;
          const isToday = isSameDay(date, today);
          const isDisabled = isDateDisabled(date, min, max);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              aria-label={date.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              aria-pressed={isSelected}
              className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                isSelected
                  ? "bg-indigo-600 font-semibold text-white"
                  : isToday
                    ? "font-semibold text-indigo-600"
                    : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700"
              } ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              onClick={() => handleDayClick(date)}
              onKeyDown={(e) => handleDayKeyDown(e, date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
