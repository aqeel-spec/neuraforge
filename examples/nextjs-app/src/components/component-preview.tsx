"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Code2, Copy, Check, Monitor, Tablet, Smartphone } from "lucide-react";

interface ComponentPreviewProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  install?: string; // package name, defaults to @neuraforge-ui/components
  className?: string;
  expandable?: boolean;
}

type DeviceSize = "desktop" | "tablet" | "mobile";
type PackageManager = "npm" | "pnpm" | "bun";

const deviceWidths: Record<DeviceSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const deviceLabels: Record<DeviceSize, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: "Desktop" },
  tablet: { icon: Tablet, label: "Tablet" },
  mobile: { icon: Smartphone, label: "Mobile" },
};

function getInstallCommand(pm: PackageManager, pkg: string): string {
  switch (pm) {
    case "npm":
      return `npm install ${pkg}`;
    case "pnpm":
      return `pnpm add ${pkg}`;
    case "bun":
      return `bun add ${pkg}`;
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

  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] scroll-mt-24 transition-all duration-300",
        "hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:border-[hsl(var(--border))]/60",
        "target:ring-2 target:ring-[hsl(var(--primary))]/20 target:border-[hsl(var(--primary))]/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">{title}</h3>
          {description && (
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Responsive toggles */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-[hsl(var(--muted))]/40 p-[2px]">
            {(Object.keys(deviceWidths) as DeviceSize[]).map((size) => {
              const { icon: Icon } = deviceLabels[size];
              return (
                <button
                  key={size}
                  onClick={() => setDevice(size)}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-150",
                    device === size
                      ? "bg-white dark:bg-zinc-800 shadow-sm text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                  aria-label={`${deviceLabels[size].label} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          {/* Preview/Code toggle */}
          {code && (
            <div className="flex items-center rounded-lg bg-[hsl(var(--muted))]/60 p-[3px] border border-[hsl(var(--border))]/40">
              <button
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                  activeTab === "preview"
                    ? "text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {activeTab === "preview" && (
                  <motion.div
                    layoutId={`tab-${id || title}`}
                    className="absolute inset-0 bg-white rounded-md shadow-sm border border-[hsl(var(--border))]/40"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Eye className="h-3 w-3 relative z-10" />
                <span className="relative z-10">Preview</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                  activeTab === "code"
                    ? "text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {activeTab === "code" && (
                  <motion.div
                    layoutId={`tab-${id || title}`}
                    className="absolute inset-0 bg-white rounded-md shadow-sm border border-[hsl(var(--border))]/40"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Code2 className="h-3 w-3 relative z-10" />
                <span className="relative z-10">Code</span>
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
            transition={{ duration: 0.2 }}
          >
            {/* Preview Area */}
            <div
              className={cn(
                "w-full p-6",
                expandable ? "min-h-[300px]" : "min-h-[120px]"
              )}
            >
              <div className="mx-auto transition-all duration-300" style={{ maxWidth: deviceWidths[device] }}>
                {children}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Package Manager Install Tabs */}
            <div className="border-b border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20">
              <div className="px-6 pt-4 pb-0">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Install
                  </span>
                  <div className="flex items-center rounded-md bg-[hsl(var(--muted))]/60 p-[2px] border border-[hsl(var(--border))]/40">
                    {(["npm", "pnpm", "bun"] as PackageManager[]).map((pm) => (
                      <button
                        key={pm}
                        onClick={() => setPackageManager(pm)}
                        className={cn(
                          "relative rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                          packageManager === pm
                            ? "bg-white text-[hsl(var(--foreground))] shadow-sm border border-[hsl(var(--border))]/40"
                            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        )}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <pre className="code-block m-0 rounded-lg border border-zinc-800/80 py-3 px-4 text-[12px]">
                    <code>{getInstallCommand(packageManager, install)}</code>
                  </pre>
                  <button
                    onClick={copyInstall}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-200 opacity-0 group-hover:opacity-100",
                      copiedInstall
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-700 text-zinc-300 border border-zinc-600/50 hover:bg-zinc-600"
                    )}
                  >
                    {copiedInstall ? (
                      <><Check className="h-2.5 w-2.5" /> Copied</>
                    ) : (
                      <><Copy className="h-2.5 w-2.5" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
              <div className="h-4" />
            </div>

            {/* Usage Code */}
            {code && (
              <div className="relative">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Usage
                  </span>
                  <button
                    onClick={copyCode}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200 border",
                      copied
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700 hover:text-white"
                    )}
                  >
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copied!</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                </div>
                <pre className="code-block m-0 mx-6 mb-6 rounded-lg border-0 py-5 px-5 max-h-[380px] overflow-y-auto">
                  <code className="text-[12.5px] leading-[1.85]">{code}</code>
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
