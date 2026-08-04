"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Code2, Copy, Check } from "lucide-react";

interface ComponentPreviewProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  className?: string;
}

export function ComponentPreview({
  title,
  description,
  children,
  code,
  className,
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn("rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-glow overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3.5 bg-[hsl(var(--muted))]/30">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] tracking-tight">{title}</h3>
          {description && (
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed truncate">{description}</p>
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
                  layoutId={`tab-bg-${title}`}
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
                  layoutId={`tab-bg-${title}`}
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
      <AnimatePresence mode="wait">
        {activeTab === "preview" ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6 dot-pattern min-h-[120px]"
          >
            <div className="bg-[hsl(var(--background))] rounded-lg p-6 shadow-sm border border-[hsl(var(--border))]">
              {children}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Copy button */}
            <div className="absolute right-4 top-4 z-10">
              <motion.button
                onClick={copyCode}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50 transition-all duration-200 shadow-lg"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1"
                    >
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            <pre className="code-block m-0 rounded-none border-0 border-t border-zinc-800/50 py-6 max-h-[400px] overflow-y-auto">
              <code className="text-[13px] leading-[1.7]">{code}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
