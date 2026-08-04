"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Navigation, MessageSquare, FormInput, BarChart3,
  Megaphone, Sparkles, Palette, Bot, Menu, X,
  Package, Code2, Zap, Search, ChevronRight, ExternalLink
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
      { title: "Navigation", href: "/components/navigation", icon: Navigation, count: 8 },
      { title: "Layout", href: "/components/layout", icon: LayoutGrid, count: 5 },
      { title: "Feedback", href: "/components/feedback", icon: MessageSquare, count: 8 },
      { title: "Forms", href: "/components/forms", icon: FormInput, count: 10 },
      { title: "Data Display", href: "/components/data-display", icon: BarChart3, count: 8 },
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
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[hsl(var(--background))]">
      {/* Scroll Progress */}
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 h-[var(--header-height)] glass gradient-border">
        <div className="flex h-full items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-smooth lg:hidden"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm group-hover:shadow-md transition-all duration-300">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
                NeuraForge
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200/80">
                UI
              </span>
            </div>
          </Link>

          {/* Search */}
          <div className="ml-4 hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
              <input
                type="text"
                placeholder="Search components..."
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] py-2 pl-9 pr-16 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]/40 transition-all duration-200"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <kbd className="inline-flex items-center rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] shadow-sm">
                  ⌘
                </kbd>
                <kbd className="inline-flex items-center rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] shadow-sm">
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            <a
              href="https://www.npmjs.com/org/neuraforge-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-smooth"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">npm</span>
            </a>
            <a
              href="https://github.com/aqeel-spec/neuraforge"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-smooth"
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <div className="hidden sm:block ml-2 h-5 w-px bg-[hsl(var(--border))]" />
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-1.5 ml-2 rounded-lg bg-[hsl(var(--foreground))] px-3.5 py-2 text-[13px] font-medium text-[hsl(var(--background))] hover:opacity-90 transition-smooth shadow-sm"
            >
              Get Started
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ─── SIDEBAR ─── */}
        <AnimatePresence>
          {(sidebarOpen || true) && (
            <motion.aside
              className={cn(
                "fixed top-[var(--header-height)] z-40 h-[calc(100vh-var(--header-height))] w-[var(--sidebar-width)] shrink-0 overflow-y-auto border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl py-6 px-3 lg:sticky lg:block",
                sidebarOpen ? "block" : "hidden lg:block"
              )}
              initial={false}
            >
              <nav className="space-y-7">
                {sidebarNav.map((section) => (
                  <div key={section.title}>
                    <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]/60">
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
                            className={cn(
                              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                              isActive
                                ? "active-pill bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            )}
                          >
                            <Icon className={cn(
                              "h-4 w-4 transition-all duration-200",
                              isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]/50 group-hover:text-[hsl(var(--foreground))]/70"
                            )} />
                            <span className="flex-1">{item.title}</span>
                            {"count" in item && item.count && (
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums transition-colors",
                                isActive
                                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
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

              {/* Bottom card */}
              <div className="mt-8 mx-1 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 ring-1 ring-violet-100/80">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Package className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-violet-900 tracking-tight">Quick Install</span>
                </div>
                <code className="block text-[11px] text-violet-700/80 font-mono leading-relaxed">
                  npm i @neuraforge-ui/components
                </code>
                <a
                  href="https://www.npmjs.com/org/neuraforge-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-800 transition-colors"
                >
                  View on npm
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-[var(--header-height)] z-30 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[880px] px-6 py-10 lg:px-10 lg:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
