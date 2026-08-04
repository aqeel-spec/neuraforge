import { useId, useRef, useState, useCallback } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";

export interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
  error?: string;
  description?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}

export function FileUpload({
  label,
  accept,
  multiple = false,
  maxSize,
  onFiles,
  disabled = false,
  error: externalError,
  description,
}: FileUploadProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const dropzoneId = `${generatedId}-dropzone`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const errorId = `${generatedId}-error`;

  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedError = externalError ?? internalError;

  const validateAndEmit = useCallback(
    (files: File[]) => {
      setInternalError("");

      if (maxSize) {
        const oversized = files.filter((f) => f.size > maxSize);
        if (oversized.length > 0) {
          setInternalError(
            `File${oversized.length > 1 ? "s" : ""} exceed maximum size of ${formatBytes(maxSize)}`,
          );
          return;
        }
      }

      if (!multiple && files.length > 1) {
        const first = files[0];
        if (first) files = [first];
      }

      setSelectedFiles(files);
      onFiles?.(files);
    },
    [maxSize, multiple, onFiles],
  );

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      validateAndEmit(droppedFiles);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndEmit(Array.from(files));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  function handleClick() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-900">{label}</span>
      {description ? (
        <p id={descriptionId} className="text-sm text-slate-600">
          {description}
        </p>
      ) : null}
      <div
        id={dropzoneId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${label} file upload area. ${multiple ? "Multiple files allowed." : "Single file."} ${accept ? `Accepted types: ${accept}` : ""}`}
        aria-describedby={
          [descriptionId, resolvedError ? errorId : undefined].filter(Boolean).join(" ") ||
          undefined
        }
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[8rem] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : isDragging
              ? "border-indigo-500 bg-indigo-50"
              : resolvedError
                ? "border-red-300 bg-red-50 hover:border-red-400"
                : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <svg
          aria-hidden="true"
          className={`mb-2 h-8 w-8 ${isDragging ? "text-indigo-500" : "text-slate-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
        </p>
        {accept ? <p className="mt-1 text-xs text-slate-500">{accept}</p> : null}
        {maxSize ? (
          <p className="mt-1 text-xs text-slate-500">Max size: {formatBytes(maxSize)}</p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {selectedFiles.length > 0 && !resolvedError ? (
        <ul className="mt-2 space-y-1">
          {selectedFiles.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="truncate">{file.name}</span>
              <span className="text-xs text-slate-500">({formatBytes(file.size)})</span>
            </li>
          ))}
        </ul>
      ) : null}
      {resolvedError ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {resolvedError}
        </p>
      ) : null}
    </div>
  );
}
