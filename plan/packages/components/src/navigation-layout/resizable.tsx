import { type ReactNode, useCallback, useRef, useState } from "react";
import { classes } from "./shared.js";

export interface ResizableProps {
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  direction?: "horizontal" | "vertical" | "both";
  className?: string;
}

export function Resizable({
  children,
  minWidth = 100,
  minHeight = 100,
  maxWidth = Infinity,
  maxHeight = Infinity,
  defaultWidth = 300,
  defaultHeight = 200,
  direction = "both",
  className,
}: ResizableProps) {
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const clamp = (val: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, val));

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      isResizingRef.current = true;

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = size.width;
      const startHeight = size.height;

      const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (!isResizingRef.current) return;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (direction === "horizontal" || direction === "both") {
          newWidth = clamp(startWidth + (e.clientX - startX), minWidth, maxWidth);
        }
        if (direction === "vertical" || direction === "both") {
          newHeight = clamp(startHeight + (e.clientY - startY), minHeight, maxHeight);
        }

        setSize({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [size, direction, minWidth, minHeight, maxWidth, maxHeight],
  );

  const canResizeH = direction === "horizontal" || direction === "both";
  const canResizeV = direction === "vertical" || direction === "both";

  return (
    <div
      ref={containerRef}
      className={classes("relative overflow-hidden rounded-lg border border-slate-200", className)}
      style={{
        width: canResizeH ? size.width : undefined,
        height: canResizeV ? size.height : undefined,
      }}
      aria-label="Resizable container"
    >
      <div className="h-full w-full overflow-auto">{children}</div>
      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation={
          direction === "horizontal"
            ? "vertical"
            : direction === "vertical"
              ? "horizontal"
              : undefined
        }
        aria-label="Resize handle"
        className={classes(
          "absolute select-none",
          direction === "horizontal" &&
            "bottom-0 right-0 top-0 w-2 cursor-col-resize border-l border-slate-300 bg-slate-50 hover:bg-indigo-100",
          direction === "vertical" &&
            "bottom-0 left-0 right-0 h-2 cursor-row-resize border-t border-slate-300 bg-slate-50 hover:bg-indigo-100",
          direction === "both" &&
            "bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl-md bg-slate-200 hover:bg-indigo-200",
        )}
        onMouseDown={handleMouseDown}
      >
        {direction === "both" ? (
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 20L20 4M10 20L20 10M16 20L20 16"
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
