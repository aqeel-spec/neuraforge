"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Code2, Copy, Check } from "lucide-react";

interface ComponentPreviewProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  className?: string;
  /** Set to true for components with dropdowns/popups that need extra space */
  expandable?: boolean;
}

export function ComponentPreview({
  id,
  title,
  description,
  children,
  code,
  className,
  expandable = false,
}: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] scroll-mt-24 transition-all duration-300",
        "hover:border-[hsl(var(--border))]/80 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]",
        "target:ring-2 target:ring-[hsl(var(--primary))]/30 target:border-[hsl(var(--primary))]/40",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3.5 bg-[hsl(var(--muted))]/20">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-[hsl(var(--foreground))] tracking-tight">{title}</h3>
          {description && (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        {code && (
          <div className="flex items-center gap-0.5 rounded-lg bg-[hsl(var(--muted))] p-[3px] ml-4 shrink-0">
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
                  layoutId={`tab-bg-${id || title}`}
                  className="absolute inset-0 bg-[hsl(var(--background))] rounded-md shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
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
                  layoutId={`tab-bg-${id || title}`}
                  className="absolute inset-0 bg-[hsl(var(--background))] rounded-md shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Code2 className="h-3 w-3 relative z-10" />
              <span className="relative z-10">Code</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === "preview" ? (
        <div
          className={cn(
            "relative p-6",
            expandable ? "min-h-[280px]" : "min-h-[140px]"
          )}
          style={{ 
            backgroundImage: "radial-gradient(hsl(var(--border)) 0.5px, transparent 0.5px)",
            backgroundSize: "16px 16px" 
          }}
        >
          <div
            className={cn(
              "relative bg-[hsl(var(--background))] rounded-lg p-6 border border-[hsl(var(--border))]/60 shadow-sm",
              expandable && "overflow-visible min-h-[200px]"
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Copy button */}
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50 transition-all duration-200 shadow-lg"
            >
              {copied ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Copy className="h-3 w-3" />
                  Copy
                </span>
              )}
            </button>
          </div>
          <pre className="code-block m-0 rounded-none rounded-b-xl border-0 border-t border-zinc-800/50 py-5 px-5 max-h-[360px] overflow-y-auto">
            <code className="text-[12.5px] leading-[1.8]">{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
