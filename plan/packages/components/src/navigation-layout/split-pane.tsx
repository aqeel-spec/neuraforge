'use client';

import {
  Children,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { classes, focusRing } from "./shared.js";

export interface SplitPaneProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Split direction. */
  direction?: "horizontal" | "vertical";
  /** Default size of the first pane as a percentage (0–100). */
  defaultSize?: number;
  /** Minimum size of either pane as a percentage. */
  minSize?: number;
  /** Exactly two children are required. */
  children: [ReactNode, ReactNode];
  className?: string;
}

export function SplitPane({
  direction = "horizontal",
  defaultSize = 50,
  minSize = 10,
  children,
  className,
  ...props
}: SplitPaneProps) {
  const childArray = Children.toArray(children);
  if (childArray.length !== 2) {
    throw new Error("SplitPane requires exactly 2 children.");
  }

  const [size, setSize] = useState(defaultSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = useCallback(
    (value: number) => Math.min(100 - minSize, Math.max(minSize, value)),
    [minSize],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent: number;
      if (direction === "horizontal") {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      }
      setSize(clamp(percent));
    },
    [direction, clamp],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 2;
      if (direction === "horizontal") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setSize((s) => clamp(s - step));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setSize((s) => clamp(s + step));
        }
      } else {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSize((s) => clamp(s - step));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSize((s) => clamp(s + step));
        }
      }
    },
    [direction, clamp],
  );

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={classes("flex overflow-hidden", isHorizontal ? "flex-row" : "flex-col", className)}
      {...props}
    >
      {/* First pane */}
      <div
        className="overflow-auto"
        style={isHorizontal ? { width: `${size}%` } : { height: `${size}%` }}
      >
        {childArray[0]}
      </div>

      {/* Divider / resize handle */}
      <div
        role="separator"
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={minSize}
        aria-valuemax={100 - minSize}
        aria-label="Resize"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={classes(
          "relative z-10 flex shrink-0 items-center justify-center bg-slate-100 transition-colors hover:bg-violet-100 active:bg-violet-200",
          isHorizontal ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize",
          focusRing,
        )}
      >
        <span
          aria-hidden="true"
          className={classes("rounded-full bg-slate-400", isHorizontal ? "h-6 w-0.5" : "h-0.5 w-6")}
        />
      </div>

      {/* Second pane */}
      <div className="flex-1 overflow-auto">{childArray[1]}</div>
    </div>
  );
}
