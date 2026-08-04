import { type ReactNode, useCallback, useRef, useState } from "react";
import { classes } from "./shared.js";

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  height: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  overscan = 5,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(height / itemHeight);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      setScrollTop(container.scrollTop);
    }
  }, []);

  const visibleItems: { item: T; index: number }[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    if (item !== undefined) {
      visibleItems.push({ item, index: i });
    }
  }

  return (
    <div
      ref={containerRef}
      className={classes("overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
      role="list"
      aria-label="Virtual list"
    >
      <div className="relative" style={{ height: totalHeight }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            className="absolute left-0 w-full"
            style={{
              top: index * itemHeight,
              height: itemHeight,
            }}
            role="listitem"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
