'use client';

import type { ReactNode } from "react";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className ?? ""}`}
    >
      {icon !== undefined && (
        <span aria-hidden="true" className="mb-4 text-slate-400">
          {icon}
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {description !== undefined && (
        <p className="mt-2 max-w-sm text-sm text-slate-600">{description}</p>
      )}
      {action !== undefined && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
