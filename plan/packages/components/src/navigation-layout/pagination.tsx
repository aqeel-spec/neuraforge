import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { classes, focusRing } from "./shared.js";

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

/**
 * Page navigation with prev/next buttons and numbered page links.
 *
 * - Renders a `<nav>` landmark with `aria-label="Pagination"`.
 * - The current page link uses `aria-current="page"`.
 * - Prev/Next buttons are disabled at the boundaries.
 * - Ellipsis separators appear when pages are truncated.
 * - `siblingCount` controls how many pages are shown around the current page.
 * - Keyboard: standard button/link navigation with Tab and Enter/Space.
 * - Visible focus ring on all interactive elements.
 */
export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  const pages = useMemo(
    () => buildPageRange(totalPages, currentPage, siblingCount),
    [totalPages, currentPage, siblingCount],
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={classes("flex items-center gap-1", className)}
      {...props}
    >
      {/* Previous button */}
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={classes(
          "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
          currentPage <= 1
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
          focusRing,
        )}
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${String(index)}`}
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-400"
            >
              …
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            aria-label={`Page ${String(page)}`}
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange(page)}
            className={classes(
              "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
              isCurrent
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              focusRing,
            )}
          >
            {page}
          </button>
        );
      })}

      {/* Next button */}
      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={classes(
          "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
          currentPage >= totalPages
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
          focusRing,
        )}
      >
        Next →
      </button>
    </nav>
  );
}

/**
 * Build the page range array with ellipsis markers.
 * Example: [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
function buildPageRange(
  totalPages: number,
  currentPage: number,
  siblingCount: number,
): (number | "ellipsis")[] {
  const totalSlots = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipses

  // If total pages fit within total slots, show all pages
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    // Show left side fully
    const leftCount = siblingCount * 2 + 3;
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Show right side fully
    const rightCount = siblingCount * 2 + 3;
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => totalPages - rightCount + 1 + i,
    );
    return [1, "ellipsis", ...rightRange];
  }

  // Both ellipses
  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}
