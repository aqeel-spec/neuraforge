"use client";

import React from "react";
import { ComponentPreview } from "@/components/component-preview";
import {
  Navbar,
  Sidebar,
  Breadcrumbs,
  Tabs,
} from "@neuraforge-ui/components/src/navigation-layout/index";

export default function NavigationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Navigation</h1>
        <p className="text-muted-foreground mt-2">
          Components for site navigation — Navbar, Sidebar, Breadcrumbs, and Tabs.
          All implement WAI-ARIA patterns with full keyboard support.
        </p>
      </div>

      {/* Navbar */}
      <ComponentPreview
        title="Navbar"
        description="Responsive site-wide navigation bar with mobile hamburger menu"
        code={`import { Navbar } from "@neuraforge-ui/components";

<Navbar
  brand={<span className="font-bold">MyApp</span>}
  items={[
    { label: "Home", href: "/", current: true },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]}
  actions={<button>Sign In</button>}
/>`}
      >
        <div className="w-full rounded-lg border overflow-hidden">
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

      {/* Breadcrumbs */}
      <ComponentPreview
        title="Breadcrumbs"
        description="Navigation breadcrumb trail with aria-current on the last item"
        code={`import { Breadcrumbs } from "@neuraforge-ui/components";

<Breadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Widget Pro" },
  ]}
/>`}
      >
        <Breadcrumbs
          items={[
            { label: "Home", href: "#" },
            { label: "Products", href: "#" },
            { label: "Widget Pro" },
          ]}
        />
      </ComponentPreview>

      {/* Tabs */}
      <ComponentPreview
        title="Tabs"
        description="Tabbed interface with WAI-ARIA Tabs pattern — arrow keys, Home/End, auto-activation"
        code={`import { Tabs } from "@neuraforge-ui/components";

<Tabs
  label="Settings"
  tabs={[
    { id: "general", label: "General", content: <p>General settings...</p> },
    { id: "security", label: "Security", content: <p>Security options...</p> },
    { id: "notifications", label: "Notifications", content: <p>Notification prefs...</p> },
  ]}
/>`}
      >
        <div className="w-full">
          <Tabs
            label="Settings navigation"
            tabs={[
              { id: "general", label: "General", content: <div className="py-4"><p className="text-sm text-muted-foreground">General settings panel. Use arrow keys to navigate between tabs.</p></div> },
              { id: "security", label: "Security", content: <div className="py-4"><p className="text-sm text-muted-foreground">Security and authentication options.</p></div> },
              { id: "notifications", label: "Notifications", content: <div className="py-4"><p className="text-sm text-muted-foreground">Email and push notification preferences.</p></div> },
            ]}
          />
        </div>
      </ComponentPreview>

      {/* Sidebar */}
      <ComponentPreview
        title="Sidebar"
        description="Vertical navigation with grouped sections, aria-current, and disabled state"
        code={`import { Sidebar } from "@neuraforge-ui/components";

<Sidebar
  sections={[
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", current: true },
        { label: "Analytics", href: "/analytics" },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Profile", href: "/settings/profile" },
        { label: "Billing", href: "/settings/billing" },
      ],
    },
  ]}
/>`}
      >
        <div className="w-64 rounded-lg border">
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
    </div>
  );
}
