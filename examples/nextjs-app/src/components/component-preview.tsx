"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, Code2, Copy, Check, Maximize2 } from "lucide-react";

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
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("rounded-xl border bg-white shadow-soft overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        {code && (
          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setShowCode(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                !showCode
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
            <button
              onClick={() => setShowCode(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                showCode
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="h-3 w-3" />
              Code
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {!showCode ? (
        <div className="p-6 dot-pattern">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            {children}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
            >
              {copied ? (
                <><Check className="h-3 w-3 text-emerald-400" /> Copied!</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
          </div>
          <pre className="code-block m-0 rounded-none border-0 border-t py-6">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
