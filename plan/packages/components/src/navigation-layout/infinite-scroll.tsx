import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { classes } from "./shared.js";

export interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  loader?: ReactNode;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  loading = false,
  loader,
  children,
  threshold = 200,
  className,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: `0px 0px ${threshold}px 0px`,
    });
    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, threshold]);

  const defaultLoader = (
    <div className="flex items-center justify-center py-4" aria-live="polite">
      <svg
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="ml-2 text-sm text-slate-600">Loading more…</span>
    </div>
  );

  return (
    <div className={classes("relative", className)} role="feed" aria-busy={loading}>
      {children}
      {/* Sentinel element observed for intersection */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {loading ? (loader ?? defaultLoader) : null}
      {!hasMore && !loading ? (
        <p className="py-4 text-center text-sm text-slate-500">No more items to load.</p>
      ) : null}
    </div>
  );
}
