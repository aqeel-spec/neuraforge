const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface KBDProps {
  keys: string[];
  className?: string;
}

export function KBD({ keys, className }: KBDProps) {
  return (
    <span
      className={joinClasses("inline-flex items-center gap-0.5", className)}
      aria-label={keys.join(" + ")}
    >
      {keys.map((key, index) => (
        <kbd
          key={`${key}-${String(index)}`}
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
