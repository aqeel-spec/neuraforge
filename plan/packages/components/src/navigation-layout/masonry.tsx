import { Children, type ReactNode, useMemo } from "react";
import { classes } from "./shared.js";

export interface MasonryProps {
  columns?: number;
  gap?: number;
  children: ReactNode;
  className?: string;
}

export function Masonry({ columns = 3, gap = 16, children, className }: MasonryProps) {
  const childArray = Children.toArray(children);

  const columnContents = useMemo(() => {
    const cols: ReactNode[][] = Array.from({ length: columns }, () => []);
    childArray.forEach((child, index) => {
      const col = cols[index % columns];
      if (col) col.push(child);
    });
    return cols;
  }, [childArray, columns]);

  return (
    <div
      className={classes("flex", className)}
      style={{ gap }}
      role="list"
      aria-label="Masonry grid"
    >
      {columnContents.map((colItems, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col" style={{ gap }} role="presentation">
          {colItems.map((item, itemIndex) => (
            <div key={itemIndex} role="listitem">
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
