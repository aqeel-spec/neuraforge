import type { ReactNode } from "react";

const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
  rowHeader?: boolean;
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  emptyMessage?: string;
  className?: string;
}

const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = "No data available.",
  className,
}: DataTableProps<Row>) {
  return (
    <div
      className={joinClasses(
        "w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700",
        className,
      )}
      data-capability-fallback="horizontal-scroll"
    >
      <table className="min-w-full border-collapse bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-100 supports-[position:sticky]:sticky supports-[position:sticky]:top-0">
          <tr>
            {columns.map((column) => (
              <th
                className={joinClasses(
                  "whitespace-nowrap px-4 py-3 font-semibold",
                  alignmentClasses[column.align ?? "left"],
                )}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" key={getRowKey(row)}>
                {columns.map((column) => {
                  const Cell = column.rowHeader === true ? "th" : "td";
                  return (
                    <Cell
                      className={joinClasses(
                        "px-4 py-3",
                        column.rowHeader === true && "font-medium text-slate-950 dark:text-slate-100",
                        alignmentClasses[column.align ?? "left"],
                      )}
                      key={column.key}
                      {...(column.rowHeader === true ? { scope: "row" as const } : {})}
                    >
                      {column.cell(row)}
                    </Cell>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
