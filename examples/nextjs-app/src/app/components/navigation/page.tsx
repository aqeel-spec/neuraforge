// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import {
  Navbar,
  Sidebar,
  Breadcrumbs,
  Tabs,
  CommandPalette,
  MegaMenu,
  Pagination,
  StepIndicator,
  BottomNav,
  TableOfContents,
  SegmentedControl,
  BackToTop,
  Dock,
  ContextMenu,
} from "@neuraforge-ui/components/src/navigation-layout/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function NavigationPage() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle hash-based navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Navigation</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          14 navigation components — from top-level navbars and mega menus to breadcrumbs, tabs,
          command palettes, pagination, step indicators, bottom navigation, table of contents,
          segmented controls, back-to-top buttons, docks, and context menus. All implement WAI-ARIA patterns with full keyboard support.
        </p>
      </motion.div>

      {/* Navbar */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="navbar"
          title="Navbar"
          description="Responsive site-wide navigation bar with mobile hamburger menu"
          code={`import { Navbar } from "@neuraforge-ui/components/src/navigation-layout/index";

<Navbar
  brand={<span className="font-bold">MyApp</span>}
  items={[
    { label: "Home", href: "/", current: true },
    { label: "Products", href: "/products" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
  ]}
  actions={<button>Sign In</button>}
/>`}
        >
          <div className="w-full rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <Navbar
              brand={<span className="font-bold text-sm">MyApp</span>}
              items={[
                { label: "Home", href: "#", current: true },
                { label: "Products", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Docs", href: "#" },
              ]}
              actions={
                <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
                  Sign In
                </button>
              }
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* MegaMenu */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="mega-menu"
          title="MegaMenu"
          description="Multi-column dropdown navigation with grouped links and descriptions"
          expandable
          code={`import { MegaMenu } from "@neuraforge-ui/components/src/navigation-layout/index";

<MegaMenu
  trigger="Products"
  columns={[
    {
      title: "Platform",
      links: [
        { label: "Analytics", href: "/analytics", description: "Track metrics" },
        { label: "Automation", href: "/auto", description: "Workflow builder" },
      ],
    },
  ]}
/>`}
        >
          <div className="w-full">
            <MegaMenu
              trigger="Products"
              columns={[
                {
                  title: "Platform",
                  links: [
                    { label: "Analytics", href: "#", description: "Track metrics in real-time" },
                    { label: "Automation", href: "#", description: "Build powerful workflows" },
                    { label: "Integrations", href: "#", description: "Connect your stack" },
                  ],
                },
                {
                  title: "Solutions",
                  links: [
                    { label: "Enterprise", href: "#", description: "For large teams" },
                    { label: "Startups", href: "#", description: "Move fast, ship faster" },
                  ],
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Breadcrumbs */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="breadcrumbs"
          title="Breadcrumbs"
          description="Navigation breadcrumb trail with aria-current on the last item"
          code={`import { Breadcrumbs } from "@neuraforge-ui/components/src/navigation-layout/index";

<Breadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Components", href: "/components" },
    { label: "Navigation" },
  ]}
/>`}
        >
          <Breadcrumbs
            items={[
              { label: "Home", href: "#" },
              { label: "Components", href: "#" },
              { label: "Navigation" },
            ]}
          />
        </ComponentPreview>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="tabs"
          title="Tabs"
          description="Tabbed interface with WAI-ARIA Tabs pattern — arrow keys, Home/End, auto-activation"
          code={`import { Tabs } from "@neuraforge-ui/components/src/navigation-layout/index";

<Tabs
  label="Settings"
  tabs={[
    { id: "general", label: "General", content: <p>General settings</p> },
    { id: "security", label: "Security", content: <p>Security options</p> },
    { id: "billing", label: "Billing", content: <p>Billing info</p> },
  ]}
/>`}
        >
          <div className="w-full">
            <Tabs
              label="Settings navigation"
              tabs={[
                { id: "general", label: "General", content: <div className="py-4"><p className="text-sm text-[hsl(var(--muted-foreground))]">General settings panel. Use arrow keys to navigate tabs.</p></div> },
                { id: "security", label: "Security", content: <div className="py-4"><p className="text-sm text-[hsl(var(--muted-foreground))]">Security and authentication options.</p></div> },
                { id: "billing", label: "Billing", content: <div className="py-4"><p className="text-sm text-[hsl(var(--muted-foreground))]">Manage billing and subscriptions.</p></div> },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CommandPalette */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="command-palette"
          title="CommandPalette"
          expandable
          description="Keyboard-driven command menu with fuzzy search — like ⌘K"
          code={`import { CommandPalette } from "@neuraforge-ui/components/src/navigation-layout/index";

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  commands={[
    { id: "home", label: "Go to Home", action: () => router.push("/") },
    { id: "search", label: "Search docs", action: () => openSearch() },
  ]}
/>`}
        >
          <div>
            <button
              onClick={() => setCmdOpen(true)}
              className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              Open Command Palette (⌘K)
            </button>
            <CommandPalette
              open={cmdOpen}
              onOpenChange={setCmdOpen}
              commands={[
                { id: "home", label: "Go to Home", action: () => setCmdOpen(false) },
                { id: "components", label: "Browse Components", action: () => setCmdOpen(false) },
                { id: "tokens", label: "View Design Tokens", action: () => setCmdOpen(false) },
                { id: "mcp", label: "MCP Integration", action: () => setCmdOpen(false) },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Pagination */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="pagination"
          title="Pagination"
          description="Page navigation with first/last, prev/next, and numbered pages"
          code={`import { Pagination } from "@neuraforge-ui/components/src/navigation-layout/index";

<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => setPage(page)}
/>`}
        >
          <div className="w-full flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={10}
              onPageChange={setCurrentPage}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* StepIndicator */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="step-indicator"
          title="StepIndicator"
          description="Multi-step progress indicator with completed, active, and upcoming states"
          code={`import { StepIndicator } from "@neuraforge-ui/components/src/navigation-layout/index";

<StepIndicator
  currentStep="profile"
  steps={[
    { id: "account", label: "Account" },
    { id: "profile", label: "Profile" },
    { id: "review", label: "Review" },
  ]}
/>`}
        >
          <div className="w-full">
            <StepIndicator
              currentStep="profile"
              steps={[
                { id: "account", label: "Create Account" },
                { id: "profile", label: "Setup Profile" },
                { id: "billing", label: "Add Billing" },
                { id: "review", label: "Review" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Sidebar */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="sidebar"
          title="Sidebar"
          description="Vertical navigation with grouped sections, aria-current, and disabled states"
          code={`import { Sidebar } from "@neuraforge-ui/components/src/navigation-layout/index";

<Sidebar
  sections={[
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", current: true },
        { label: "Analytics", href: "/analytics" },
      ],
    },
  ]}
/>`}
        >
          <div className="w-64 rounded-lg border border-[hsl(var(--border))]">
            <Sidebar
              sections={[
                {
                  title: "Overview",
                  items: [
                    { label: "Dashboard", href: "#", current: true },
                    { label: "Analytics", href: "#" },
                    { label: "Reports", href: "#" },
                  ],
                },
                {
                  title: "Settings",
                  items: [
                    { label: "Profile", href: "#" },
                    { label: "Billing", href: "#" },
                    { label: "API Keys", href: "#", disabled: true },
                  ],
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* BottomNav */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="bottom-nav"
          title="BottomNav"
          description="Mobile-friendly bottom navigation bar with icon + label items"
          code={`import { BottomNav } from "@neuraforge-ui/components/src/navigation-layout/index";

<BottomNav
  items={[
    { id: "home", label: "Home", icon: "🏠", href: "/" },
    { id: "search", label: "Search", icon: "🔍", href: "/search" },
    { id: "favorites", label: "Favorites", icon: "❤️", href: "/favorites" },
    { id: "profile", label: "Profile", icon: "👤", href: "/profile" },
  ]}
  activeItem="home"
/>`}
        >
          <div className="w-full max-w-sm mx-auto rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <BottomNav
              items={[
                { label: "Home", icon: <span>🏠</span>, href: "#", active: true },
                { label: "Search", icon: <span>🔍</span>, href: "#" },
                { label: "Favorites", icon: <span>❤️</span>, href: "#" },
                { label: "Profile", icon: <span>👤</span>, href: "#" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* TableOfContents */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="table-of-contents"
          title="TableOfContents"
          description="Hierarchical table of contents with nested items and active state tracking"
          code={`import { TableOfContents } from "@neuraforge-ui/components/src/navigation-layout/index";

<TableOfContents
  items={[
    { id: "intro", label: "Introduction", href: "#intro" },
    {
      id: "getting-started",
      label: "Getting Started",
      href: "#getting-started",
      children: [
        { id: "install", label: "Installation", href: "#install" },
        { id: "config", label: "Configuration", href: "#config" },
      ],
    },
    { id: "api", label: "API Reference", href: "#api" },
  ]}
  activeId="install"
/>`}
        >
          <div className="w-64 rounded-lg border border-[hsl(var(--border))] p-4">
            <TableOfContents
              items={[
                { id: "intro", label: "Introduction", href: "#" },
                {
                  id: "getting-started",
                  label: "Getting Started",
                  href: "#",
                  children: [
                    { id: "install", label: "Installation", href: "#" },
                    { id: "config", label: "Configuration", href: "#" },
                    { id: "usage", label: "Basic Usage", href: "#" },
                  ],
                },
                {
                  id: "components",
                  label: "Components",
                  href: "#",
                  children: [
                    { id: "buttons", label: "Buttons", href: "#" },
                    { id: "inputs", label: "Inputs", href: "#" },
                  ],
                },
                { id: "api", label: "API Reference", href: "#" },
              ]}
              activeId="install"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* SegmentedControl */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="segmented-control"
          title="SegmentedControl"
          description="Toggle between mutually exclusive options — like a radio group styled as connected buttons"
          code={`import { SegmentedControl } from "@neuraforge-ui/components/src/navigation-layout/index";

<SegmentedControl
  label="View mode"
  options={[
    { id: "list", label: "List" },
    { id: "grid", label: "Grid" },
    { id: "calendar", label: "Calendar" },
  ]}
  value="grid"
  onChange={(id) => setView(id)}
/>`}
        >
          <div className="w-full flex justify-center">
            <SegmentedControl
              segments={[
                { id: "list", label: "📋 List" },
                { id: "grid", label: "⊞ Grid" },
                { id: "calendar", label: "📅 Calendar" },
              ]}
              value="grid"
              onChange={() => {}}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* BackToTop */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="back-to-top"
          title="BackToTop"
          description="Floating button that appears after scrolling down, smoothly scrolls back to the top"
          code={`import { BackToTop } from "@neuraforge-ui/components/src/navigation-layout/index";

// Place at the root of your page layout
<BackToTop
  threshold={300}
  label="Back to top"
  smooth
/>`}
        >
          <div className="w-full text-center py-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
              The BackToTop button appears as a floating action button when the user scrolls past the threshold.
            </p>
            <div className="relative inline-block">
              <BackToTop threshold={300} label="Back to top" smooth />
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Dock */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="dock"
          title="Dock"
          description="macOS-style dock with magnification effect on hover — great for app launchers"
          code={`import { Dock } from "@neuraforge-ui/components/src/navigation-layout/index";

<Dock
  items={[
    { id: "finder", label: "Finder", icon: "📁", onClick: () => {} },
    { id: "browser", label: "Browser", icon: "🌐", onClick: () => {} },
    { id: "terminal", label: "Terminal", icon: "🖥️", onClick: () => {} },
    { id: "music", label: "Music", icon: "🎵", onClick: () => {} },
    { id: "mail", label: "Mail", icon: "✉️", onClick: () => {} },
  ]}
  magnification
/>`}
        >
          <div className="w-full flex justify-center py-6">
            <Dock
              items={[
                { id: "finder", label: "Finder", icon: "📁", onClick: () => {} },
                { id: "browser", label: "Browser", icon: "🌐", onClick: () => {} },
                { id: "terminal", label: "Terminal", icon: "🖥️", onClick: () => {} },
                { id: "music", label: "Music", icon: "🎵", onClick: () => {} },
                { id: "mail", label: "Mail", icon: "✉️", onClick: () => {} },
                { id: "settings", label: "Settings", icon: "⚙️", onClick: () => {} },
              ]}
              magnification
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ContextMenu */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="context-menu"
          title="ContextMenu"
          description="Right-click context menu with grouped actions, keyboard shortcuts, and dividers"
          code={`import { ContextMenu } from "@neuraforge-ui/components/src/navigation-layout/index";

<ContextMenu
  items={[
    { id: "cut", label: "Cut", shortcut: "⌘X", action: () => {} },
    { id: "copy", label: "Copy", shortcut: "⌘C", action: () => {} },
    { id: "paste", label: "Paste", shortcut: "⌘V", action: () => {} },
    { type: "divider" },
    { id: "delete", label: "Delete", action: () => {}, destructive: true },
  ]}
>
  <div>Right-click this area</div>
</ContextMenu>`}
        >
          <div className="w-full flex justify-center">
            <ContextMenu
              items={[
                { label: "Cut", shortcut: "⌘X", onClick: () => {} },
                { label: "Copy", shortcut: "⌘C", onClick: () => {} },
                { label: "Paste", shortcut: "⌘V", onClick: () => {} },
                { label: "", separator: true },
                { label: "Select All", shortcut: "⌘A", onClick: () => {} },
                { label: "", separator: true },
                { label: "Delete", onClick: () => {} },
              ]}
            >
              <div className="w-64 h-32 rounded-lg border-2 border-dashed border-[hsl(var(--border))] flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))] cursor-default select-none hover:border-[hsl(var(--primary))] transition-colors">
                Right-click this area
              </div>
            </ContextMenu>
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
