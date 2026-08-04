import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface SignaturePadProps {
  /** Called with the signature data URL (PNG) or null when cleared */
  onChange?: (dataUrl: string | null) => void;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Pen stroke color */
  penColor?: string;
  /** Canvas background color */
  backgroundColor?: string;
  /** Disable drawing */
  disabled?: boolean;
  /** Accessible label for the signature canvas */
  label?: string;
  /** Label for the clear button */
  clearLabel?: string;
  /** Additional CSS class names for the wrapper */
  className?: string;
}

export function SignaturePad({
  onChange,
  width = 400,
  height = 200,
  penColor = "#000",
  backgroundColor = "#fff",
  disabled = false,
  label = "Signature",
  clearLabel = "Clear",
  className,
}: SignaturePadProps) {
  const generatedId = useId();
  const canvasId = `${generatedId}-signature-canvas`;
  const instructionsId = `${generatedId}-signature-instructions`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Initialize canvas background (SSR-safe: only in useEffect)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }, [backgroundColor, width, height]);

  const getPosition = useCallback(
    (event: { clientX: number; clientY: number }): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [],
  );

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    },
    [penColor],
  );

  const emitChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange?.(dataUrl);
  }, [onChange]);

  // Mouse event handlers
  const handlePointerDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      event.preventDefault();
      isDrawingRef.current = true;
      const pos = getPosition(event.nativeEvent);
      lastPointRef.current = pos;
    },
    [disabled, getPosition],
  );

  const handlePointerMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || disabled) return;
      const pos = getPosition(event.nativeEvent);
      if (lastPointRef.current) {
        drawLine(lastPointRef.current, pos);
        setHasStrokes(true);
      }
      lastPointRef.current = pos;
    },
    [disabled, getPosition, drawLine],
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      emitChange();
    }
  }, [emitChange]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;
      isDrawingRef.current = true;
      lastPointRef.current = getPosition(touch);
    },
    [disabled, getPosition],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || disabled) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;
      const pos = getPosition(touch);
      if (lastPointRef.current) {
        drawLine(lastPointRef.current, pos);
        setHasStrokes(true);
      }
      lastPointRef.current = pos;
    },
    [disabled, getPosition, drawLine],
  );

  const handleTouchEnd = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      emitChange();
    }
  }, [emitChange]);

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    setHasStrokes(false);
    onChange?.(null);
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <div className="inline-block rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
        <canvas
          ref={canvasRef}
          id={canvasId}
          width={width}
          height={height}
          role="img"
          aria-label={`${label} drawing area. Use mouse or touch to draw your signature.`}
          aria-describedby={instructionsId}
          tabIndex={disabled ? -1 : 0}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={[
            "block touch-none outline-none",
            "focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-crosshair",
          ].join(" ")}
        />
      </div>
      <p
        id={instructionsId}
        className="sr-only"
      >
        Draw your signature using a mouse, trackpad, or touch screen. Use the clear button to reset.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasStrokes}
          className={[
            "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors",
            "hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
          ].join(" ")}
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
