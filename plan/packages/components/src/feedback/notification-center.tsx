import { useCallback, useEffect, useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: ReactNode;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel?: string;
  panelLabel?: string;
  markAllReadLabel?: string;
  emptyMessage?: string;
  className?: string;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  open,
  onOpenChange,
  triggerLabel = "Notifications",
  panelLabel = "Notification panel",
  markAllReadLabel = "Mark all as read",
  emptyMessage = "No notifications",
  className,
}: NotificationCenterProps) {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const close = useCallback(() => onOpenChangeRef.current(false), []);

  useEffect(() => {
    if (!open) return;
    // Focus the panel when opened
    panelRef.current?.focus();

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, close]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unreadCount > 0
            ? `${triggerLabel}, ${unreadCount} unread`
            : triggerLabel
        }
        onClick={() => onOpenChange(!open)}
        className="relative inline-flex items-center rounded-md p-2 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5 text-slate-700 dark:text-slate-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"
          />
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label={panelLabel}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg outline-none dark:border-slate-700 dark:bg-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {triggerLabel}
              {unreadCount > 0 ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                  {unreadCount}
                </span>
              ) : null}
            </h2>
            {onMarkAllRead && unreadCount > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded px-2 py-1 text-xs font-medium text-indigo-600 outline-none hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {markAllReadLabel}
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </p>
          ) : (
            <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`relative flex gap-3 px-4 py-3 ${
                    notification.read
                      ? "bg-white dark:bg-slate-900"
                      : "bg-indigo-50/50 dark:bg-indigo-950/30"
                  }`}
                >
                  {notification.icon ? (
                    <span className="flex-shrink-0 pt-0.5" aria-hidden="true">
                      {notification.icon}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          notification.read
                            ? "font-normal text-slate-700 dark:text-slate-300"
                            : "font-semibold text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read ? (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400"
                        />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {notification.time}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-start gap-1">
                    {!notification.read && onMarkRead ? (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                        aria-label={`Mark "${notification.title}" as read`}
                        className="rounded p-1 text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    ) : null}
                    {onDismiss ? (
                      <button
                        type="button"
                        onClick={() => onDismiss(notification.id)}
                        aria-label={`Dismiss "${notification.title}"`}
                        className="rounded p-1 text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
