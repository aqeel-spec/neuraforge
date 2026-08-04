"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Code2, Copy, Check, Monitor, Tablet, Smartphone, GripVertical } from "lucide-react";

interface ComponentPreviewProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  install?: string;
  className?: string;
  expandable?: boolean;
}

type DeviceSize = "desktop" | "tablet" | "mobile";
type PackageManager = "npm" | "pnpm" | "bun";

const deviceWidths: Record<DeviceSize, number> = {
  desktop: 9999,
  tablet: 768,
  mobile: 375,
};

const deviceLabels: Record<DeviceSize, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: "Desktop" },
  tablet: { icon: Tablet, label: "Tablet" },
  mobile: { icon: Smartphone, label: "Mobile" },
};

function getInstallCommand(pm: PackageManager, pkg: string): string {
  switch (pm) {
    case "npm": return `npm install ${pkg}`;
    case "pnpm": return `pnpm add ${pkg}`;
    case "bun": return `bun add ${pkg}`;
  }
}

export function ComponentPreview({
  id,
  title,
  description,
  children,
  code,
  install = "@neuraforge-ui/components",
  className,
  expandable = false,
}: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<DeviceSize>("desktop");
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [width, setWidth] = useState<number>(9999);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Device preset click handler — sets both device and width together
  const selectDevice = useCallback((size: DeviceSize) => {
    setDevice(size);
    setWidth(deviceWidths[size]);
  }, []);

  // Draggable resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 800;

    const handleMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      const newWidth = Math.max(320, Math.min(1400, startWidth + diff * 2));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const copyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyInstall = async () => {
    const cmd = getInstallCommand(packageManager, install);
    await navigator.clipboard.writeText(cmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const currentWidth = width === 9999 ? "100%" : `${width}px`;

  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] scroll-mt-24 transition-all duration-200",
        "hover:border-[hsl(var(--border))]/80",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[hsl(var(--border))]/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          {description && (
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 ml-3 shrink-0">
          {/* Responsive toggles */}
          <div className="flex items-center gap-0.5 rounded-lg bg-[hsl(var(--muted))]/50 p-[2px]">
            {(Object.keys(deviceWidths) as DeviceSize[]).map((size) => {
              const { icon: Icon } = deviceLabels[size];
              return (
                <button
                  key={size}
                  onClick={() => selectDevice(size)}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-150",
                    device === size
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                  aria-label={`${deviceLabels[size].label} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          {/* Width indicator */}
          {width !== 9999 && (
            <span className="hidden sm:inline text-[10px] font-mono text-[hsl(var(--muted-foreground))] tabular-nums">
              {width}px
            </span>
          )}
          {/* Preview/Code toggle */}
          {code && (
            <div className="flex items-center rounded-lg bg-[hsl(var(--muted))]/50 p-[2px]">
              <button
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-[11px] font-medium transition-all duration-150",
                  activeTab === "preview"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                <Eye className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-[11px] font-medium transition-all duration-150",
                  activeTab === "code"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                <Code2 className="h-3 w-3" />
                <span className="hidden sm:inline">Code</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "preview" ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Preview Area with resizable container */}
            <div className={cn(
              "relative w-full overflow-hidden bg-[hsl(var(--muted))]/10",
              expandable ? "min-h-[350px]" : "min-h-[150px]"
            )}>
              <div className="flex justify-center w-full py-6 px-4">
                {/* Resizable content area */}
                <div
                  ref={containerRef}
                  className={cn(
                    "relative bg-white dark:bg-zinc-950 overflow-hidden transition-[max-width] duration-200",
                    width !== 9999 ? "rounded-lg border border-[hsl(var(--border))]/60 shadow-sm" : "w-full"
                  )}
                  style={{ maxWidth: currentWidth, width: "100%" }}
                >
                  <div className="w-full p-4 sm:p-5 overflow-auto">
                    {children}
                  </div>
                </div>

                {/* Right drag handle */}
                {width !== 9999 && (
                  <div
                    onMouseDown={handleMouseDown}
                    className={cn(
                      "flex items-center justify-center w-4 cursor-col-resize select-none group ml-0",
                      isDragging && "opacity-100"
                    )}
                  >
                    <div className={cn(
                      "w-1 h-12 rounded-full transition-colors",
                      isDragging ? "bg-violet-500" : "bg-[hsl(var(--border))] group-hover:bg-violet-400"
                    )} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Install */}
            <div className="border-b border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/10">
              <div className="px-4 sm:px-6 pt-4 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Install</span>
                  <div className="flex items-center rounded-md bg-[hsl(var(--muted))]/60 p-[2px]">
                    {(["npm", "pnpm", "bun"] as PackageManager[]).map((pm) => (
                      <button
                        key={pm}
                        onClick={() => setPackageManager(pm)}
                        className={cn(
                          "rounded-[4px] px-2 py-0.5 text-[10px] font-medium transition-all",
                          packageManager === pm
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-[hsl(var(--foreground))]"
                            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        )}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <pre className="rounded-lg bg-zinc-950 py-3 px-4 text-[12px] text-zinc-300 overflow-x-auto">
                    <code>{getInstallCommand(packageManager, install)}</code>
                  </pre>
                  <button
                    onClick={copyInstall}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all opacity-0 group-hover:opacity-100",
                      copiedInstall ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {copiedInstall ? <><Check className="h-2.5 w-2.5" /> Copied</> : <><Copy className="h-2.5 w-2.5" /> Copy</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Code */}
            {code && (
              <div className="relative">
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Usage</span>
                  <button
                    onClick={copyCode}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all border",
                      copied ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                    )}
                  >
                    {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
                <pre className="mx-4 sm:mx-6 mb-6 rounded-lg bg-zinc-950 py-4 px-5 max-h-[400px] overflow-auto text-[12px] text-zinc-300 leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
