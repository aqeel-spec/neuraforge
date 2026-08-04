"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Navigation, MessageSquare, FormInput, BarChart3,
  Megaphone, Sparkles, Palette, Bot, Menu, X,
  Package, Code2, Zap, Search, ChevronRight, ChevronDown, ExternalLink
} from "lucide-react";

interface ComponentItem {
  id: string;
  title: string;
}

interface NavCategory {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  components: ComponentItem[];
}

const componentCategories: NavCategory[] = [
  {
    title: "Navigation",
    href: "/components/navigation",
    icon: Navigation,
    components: [
      { id: "navbar", title: "Navbar" },
      { id: "mega-menu", title: "MegaMenu" },
      { id: "breadcrumbs", title: "Breadcrumbs" },
      { id: "tabs", title: "Tabs" },
      { id: "command-palette", title: "CommandPalette" },
      { id: "pagination", title: "Pagination" },
      { id: "step-indicator", title: "StepIndicator" },
      { id: "sidebar", title: "Sidebar" },
      { id: "bottom-nav", title: "BottomNav" },
      { id: "table-of-contents", title: "TableOfContents" },
      { id: "segmented-control", title: "SegmentedControl" },
      { id: "back-to-top", title: "BackToTop" },
      { id: "dock", title: "Dock" },
      { id: "context-menu", title: "ContextMenu" },
    ],
  },
  {
    title: "Layout",
    href: "/components/layout",
    icon: LayoutGrid,
    components: [
      { id: "hero", title: "Hero" },
      { id: "card", title: "Card" },
      { id: "grid", title: "Grid" },
      { id: "container", title: "Container" },
      { id: "footer", title: "Footer" },
      { id: "accordion", title: "Accordion" },
      { id: "divider", title: "Divider" },
      { id: "stack", title: "Stack" },
      { id: "aspect-ratio", title: "AspectRatio" },
      { id: "drawer", title: "Drawer" },
      { id: "split-pane", title: "SplitPane" },
      { id: "masonry", title: "Masonry" },
      { id: "carousel", title: "Carousel" },
      { id: "popover", title: "Popover" },
      { id: "sheet", title: "Sheet" },
      { id: "sticky", title: "Sticky" },
      { id: "bento", title: "Bento" },
      { id: "marquee", title: "Marquee" },
      { id: "parallax-section", title: "ParallaxSection" },
      { id: "resizable", title: "Resizable" },
    ],
  },
  {
    title: "Forms",
    href: "/components/forms",
    icon: FormInput,
    components: [
      { id: "text-field", title: "TextField" },
      { id: "select", title: "Select" },
      { id: "checkbox", title: "Checkbox" },
      { id: "checkbox-group", title: "CheckboxGroup" },
      { id: "radio-group", title: "RadioGroup" },
      { id: "switch", title: "Switch" },
      { id: "textarea", title: "Textarea" },
      { id: "date-picker", title: "DatePicker" },
      { id: "file-upload", title: "FileUpload" },
      { id: "form", title: "Form" },
      { id: "autocomplete", title: "Autocomplete" },
      { id: "slider", title: "Slider" },
      { id: "range-slider", title: "RangeSlider" },
      { id: "color-picker", title: "ColorPicker" },
      { id: "otp-input", title: "OTPInput" },
      { id: "phone-input", title: "PhoneInput" },
      { id: "search-input", title: "SearchInput" },
      { id: "tag-input", title: "TagInput" },
      { id: "star-rating", title: "StarRating" },
      { id: "signature-pad", title: "SignaturePad" },
    ],
  },
  {
    title: "Feedback",
    href: "/components/feedback",
    icon: MessageSquare,
    components: [
      { id: "alert", title: "Alert" },
      { id: "dialog", title: "Dialog" },
      { id: "confirm-dialog", title: "ConfirmDialog" },
      { id: "toast", title: "Toast" },
      { id: "progress", title: "Progress" },
      { id: "loading-indicator", title: "LoadingIndicator" },
      { id: "skeleton", title: "Skeleton" },
      { id: "empty-state", title: "EmptyState" },
      { id: "banner", title: "Banner" },
      { id: "notification-center", title: "NotificationCenter" },
      { id: "inline-alert", title: "InlineAlert" },
      { id: "spotlight", title: "Spotlight" },
      { id: "confetti", title: "Confetti" },
    ],
  },
  {
    title: "Data Display",
    href: "/components/data-display",
    icon: BarChart3,
    components: [
      { id: "badge", title: "Badge" },
      { id: "stat", title: "Stat" },
      { id: "avatar-group", title: "AvatarGroup" },
      { id: "tag", title: "Tag" },
      { id: "timeline", title: "Timeline" },
      { id: "tooltip", title: "Tooltip" },
      { id: "kbd", title: "KBD" },
      { id: "data-table", title: "DataTable" },
      { id: "chart", title: "Chart" },
      { id: "code-block", title: "CodeBlock" },
      { id: "copy-button", title: "CopyButton" },
      { id: "count-up", title: "CountUp" },
      { id: "list", title: "List" },
      { id: "tree-view", title: "TreeView" },
      { id: "kanban", title: "Kanban" },
      { id: "infinite-scroll", title: "InfiniteScroll" },
      { id: "virtual-list", title: "VirtualList" },
    ],
  },
  {
    title: "Marketing",
    href: "/components/marketing",
    icon: Megaphone,
    components: [
      { id: "pricing", title: "Pricing" },
      { id: "testimonial", title: "Testimonial" },
      { id: "feature-grid", title: "FeatureGrid" },
      { id: "faq", title: "FAQ" },
      { id: "cta", title: "CTA" },
      { id: "logo-cloud", title: "LogoCloud" },
      { id: "newsletter", title: "Newsletter" },
      { id: "social-proof", title: "SocialProof" },
      { id: "comparison-table", title: "ComparisonTable" },
      { id: "hero-with-video", title: "HeroWithVideo" },
      { id: "team-grid", title: "TeamGrid" },
      { id: "stats-section", title: "StatsSection" },
      { id: "announcement-bar", title: "AnnouncementBar" },
    ],
  },
];

const ecosystemNav = [
  { title: "Motion Presets", href: "/motion", icon: Sparkles },
  { title: "Design Tokens", href: "/tokens", icon: Palette },
  { title: "MCP Integration", href: "/mcp", icon: Bot },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHash, setActiveHash] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const active = componentCategories.find((c) => pathname.startsWith(c.href));
    return active ? [active.title] : [];
  });

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    setScrollProgress(progress);
  }, []);

  // Track hash changes
  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash.replace("#", ""));
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Also update hash on pathname change (initial load)
  useEffect(() => {
    setActiveHash(window.location.hash.replace("#", ""));
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-expand category when navigating
  useEffect(() => {
    const active = componentCategories.find((c) => pathname.startsWith(c.href));
    if (active && !expandedCategories.includes(active.title)) {
      setExpandedCategories((prev) => [...prev, active.title]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

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
        <aside
          className={cn(
            "fixed top-[var(--header-height)] z-40 h-[calc(100vh-var(--header-height))] w-[var(--sidebar-width)] shrink-0 overflow-y-auto border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-xl py-6 px-3 lg:sticky lg:block",
            sidebarOpen ? "block" : "hidden lg:block"
          )}
        >
          <nav className="space-y-6">
            {/* Overview */}
            <div>
              <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]/60">
                Overview
              </h4>
              <div className="space-y-0.5">
                <Link
                  href="/"
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    pathname === "/"
                      ? "active-pill bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <Zap className={cn("h-4 w-4", pathname === "/" ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]/50")} />
                  <span>Introduction</span>
                </Link>
              </div>
            </div>

            {/* Components with expandable sections */}
            <div>
              <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]/60">
                Components
              </h4>
              <div className="space-y-0.5">
                {componentCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = pathname.startsWith(category.href);
                  const isExpanded = expandedCategories.includes(category.title);

                  return (
                    <div key={category.title}>
                      {/* Category header - clickable to expand/collapse */}
                      <button
                        onClick={() => toggleCategory(category.title)}
                        className={cn(
                          "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-all duration-200",
                          isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]/50 group-hover:text-[hsl(var(--foreground))]/70"
                        )} />
                        <span className="flex-1 text-left">{category.title}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                          isActive
                            ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                        )}>
                          {category.components.length}
                        </span>
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isExpanded ? "rotate-0" : "-rotate-90",
                          isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]/50"
                        )} />
                      </button>

                      {/* Expandable sub-items */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[hsl(var(--border))] pl-3 py-1">
                              {category.components.map((comp) => {
                                const compHref = `${category.href}#${comp.id}`;
                                const isCompActive = pathname === category.href && activeHash === comp.id;
                                
                                return (
                                  <Link
                                    key={comp.id}
                                    href={compHref}
                                    onClick={() => setActiveHash(comp.id)}
                                    className={cn(
                                      "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150",
                                      isCompActive
                                        ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]/20"
                                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                                    )}
                                  >
                                    {comp.title}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ecosystem */}
            <div>
              <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]/60">
                Ecosystem
              </h4>
              <div className="space-y-0.5">
                {ecosystemNav.map((item) => {
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
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
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
        </aside>

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
          <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
