"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Navigation, MessageSquare, FormInput, BarChart3,
  Megaphone, Sparkles, Palette, Bot, Menu, X,
  Package, ExternalLink, Code2, Zap, Search
} from "lucide-react";

const sidebarNav = [
  {
    title: "Overview",
    items: [
      { title: "Introduction", href: "/", icon: Zap },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Navigation", href: "/components/navigation", icon: Navigation, count: 4 },
      { title: "Layout", href: "/components/layout", icon: LayoutGrid, count: 5 },
      { title: "Feedback", href: "/components/feedback", icon: MessageSquare, count: 4 },
      { title: "Forms", href: "/components/forms", icon: FormInput, count: 2 },
      { title: "Data Display", href: "/components/data-display", icon: BarChart3, count: 3 },
      { title: "Marketing", href: "/components/marketing", icon: Megaphone, count: 2 },
    ],
  },
  {
    title: "Ecosystem",
    items: [
      { title: "Motion Presets", href: "/motion", icon: Sparkles },
      { title: "Design Tokens", href: "/tokens", icon: Palette },
      { title: "MCP Integration", href: "/mcp", icon: Bot },
    ],
  },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[hsl(var(--background))]">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 h-[var(--header-height)] border-b bg-white/80 backdrop-blur-xl">
        <div className="flex h-full items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight">NeuraForge</span>
              <span className="hidden sm:block rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                v0.1.0
              </span>
            </div>
          </Link>

          {/* Search (placeholder) */}
          <div className="ml-4 hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search components..."
                className="w-full rounded-lg border bg-muted/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-1">
            <a
              href="https://www.npmjs.com/org/neuraforge-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">npm</span>
            </a>
            <a
              href="https://github.com/aqeel-spec/neuraforge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <div className="hidden sm:block ml-2 h-5 w-px bg-border" />
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-1.5 ml-2 rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ─── SIDEBAR ─── */}
        <aside
          className={cn(
            "fixed top-[var(--header-height)] z-40 h-[calc(100vh-var(--header-height))] w-[var(--sidebar-width)] shrink-0 overflow-y-auto border-r bg-white/50 backdrop-blur-sm py-6 px-3 lg:sticky lg:block",
            sidebarOpen ? "block" : "hidden lg:block"
          )}
        >
          <nav className="space-y-6">
            {sidebarNav.map((section) => (
              <div key={section.title}>
                <h4 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {section.title}
                </h4>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-violet-50 text-violet-900 shadow-sm ring-1 ring-violet-100"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-violet-600" : "text-muted-foreground/60 group-hover:text-foreground/70"
                        )} />
                        <span className="flex-1">{item.title}</span>
                        {"count" in item && item.count && (
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            isActive
                              ? "bg-violet-100 text-violet-700"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div className="mt-8 mx-1 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 ring-1 ring-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-violet-600 flex items-center justify-center">
                <Package className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-violet-900">Quick Install</span>
            </div>
            <code className="block text-[11px] text-violet-700 font-mono leading-relaxed">
              npm i @neuraforge-ui/components
            </code>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[var(--header-height)] z-30 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[860px] px-6 py-10 lg:px-10 lg:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
