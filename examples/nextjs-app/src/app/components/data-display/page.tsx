"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import {
  DataTable,
  Stat,
  Badge,
  AvatarGroup,
  Tag,
  Timeline,
  Tooltip,
  KBD,
} from "@neuraforge-ui/components/src/data-display";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DataDisplayPage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Data Display</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          8 data display components — tables, stats, badges, avatars, tags, timelines, tooltips,
          and keyboard shortcut indicators. Built for presenting information clearly.
        </p>
      </motion.div>

      {/* Badge */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="badge"
          title="Badge"
          description="Inline status indicator with 5 tones — neutral, brand, success, warning, danger"
          code={`import { Badge } from "@neuraforge-ui/components/src/data-display";

<Badge tone="neutral">Draft</Badge>
<Badge tone="brand">New</Badge>
<Badge tone="success">Published</Badge>
<Badge tone="warning">Beta</Badge>
<Badge tone="danger">Deprecated</Badge>`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Draft</Badge>
            <Badge tone="brand">New</Badge>
            <Badge tone="success">Published</Badge>
            <Badge tone="warning">Beta</Badge>
            <Badge tone="danger">Deprecated</Badge>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Stat */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="stat"
          title="Stat"
          description="Key metric display with label, value, description, and trend indicator"
          code={`import { Stat } from "@neuraforge-ui/components/src/data-display";

<Stat label="Downloads" value="12,847" trend={{ direction: "up", label: "+23%" }} />
<Stat label="Components" value="41" description="across 6 categories" />`}
        >
          <div className="flex flex-wrap gap-4">
            <Stat label="Downloads" value="12,847" trend={{ direction: "up", label: "+23%" }} />
            <Stat label="Components" value="41" description="across 6 categories" />
            <Stat label="Test Coverage" value="892" description="tests passing" trend={{ direction: "up", label: "100%" }} />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AvatarGroup */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="avatar-group"
          title="AvatarGroup"
          description="Stacked avatar group with overflow indicator"
          code={`import { AvatarGroup } from "@neuraforge-ui/components/src/data-display";

<AvatarGroup
  avatars={[
    { name: "Alice" },
    { name: "Bob" },
    { name: "Charlie" },
    { name: "Diana" },
    { name: "Eve" },
  ]}
  max={3}
/>`}
        >
          <AvatarGroup
            avatars={[
              { name: "Alice Johnson" },
              { name: "Bob Smith" },
              { name: "Charlie Brown" },
              { name: "Diana Prince" },
              { name: "Eve Williams" },
            ]}
            max={3}
          />
        </ComponentPreview>
      </motion.div>

      {/* Tag */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="tag"
          title="Tag"
          description="Removable tag/chip with optional close action"
          code={`import { Tag } from "@neuraforge-ui/components/src/data-display";

<Tag>React</Tag>
<Tag onRemove={() => {}}>TypeScript</Tag>`}
        >
          <div className="flex flex-wrap gap-2">
            <Tag>React</Tag>
            <Tag onRemove={() => {}}>TypeScript</Tag>
            <Tag>Tailwind CSS</Tag>
            <Tag onRemove={() => {}}>Framer Motion</Tag>
            <Tag>Next.js</Tag>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="timeline"
          title="Timeline"
          description="Vertical timeline for event sequences and changelogs"
          code={`import { Timeline } from "@neuraforge-ui/components/src/data-display";

<Timeline
  items={[
    { id: "v1", title: "v1.0.0 Released", description: "Initial launch", date: "2024-01-15" },
    { id: "v2", title: "v1.1.0", description: "Added dark mode", date: "2024-02-01" },
  ]}
/>`}
        >
          <div className="w-full">
            <Timeline
              items={[
                { id: "v010", title: "v0.1.0 Released", description: "Initial public release with 20 components", date: "2024-01-15" },
                { id: "v020", title: "v0.2.0", description: "Added 21 new components, motion presets", date: "2024-02-01" },
                { id: "v030", title: "v0.3.0", description: "MCP integration, compositions", date: "2024-03-01" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Tooltip */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="tooltip"
          title="Tooltip"
          description="Informational tooltip on hover/focus with configurable placement"
          code={`import { Tooltip } from "@neuraforge-ui/components/src/data-display";

<Tooltip content="Copy to clipboard">
  <button>Copy</button>
</Tooltip>`}
        >
          <div className="flex gap-4">
            <Tooltip content="Copy to clipboard">
              <button className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors">
                Hover me
              </button>
            </Tooltip>
            <Tooltip content="This action cannot be undone">
              <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                Delete
              </button>
            </Tooltip>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* KBD */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="kbd"
          title="KBD"
          description="Keyboard shortcut display with platform-aware modifier keys"
          code={`import { KBD } from "@neuraforge-ui/components/src/data-display";

<KBD keys={["⌘", "K"]} />
<KBD keys={["Ctrl", "Shift", "P"]} />
<KBD keys={["Esc"]} />`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Search:</span>
              <KBD keys={["⌘", "K"]} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Command:</span>
              <KBD keys={["Ctrl", "Shift", "P"]} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Close:</span>
              <KBD keys={["Esc"]} />
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* DataTable */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="data-table"
          title="DataTable"
          description="Accessible data table with caption, column alignment, and row headers"
          code={`import { DataTable, Badge } from "@neuraforge-ui/components/src/data-display";

<DataTable
  caption="Published packages"
  columns={[
    { key: "name", header: "Package", cell: (r) => r.name, rowHeader: true },
    { key: "version", header: "Version", cell: (r) => r.version },
    { key: "size", header: "Size", cell: (r) => r.size, align: "right" },
    { key: "status", header: "Status", cell: (r) => <Badge tone="success">{r.status}</Badge> },
  ]}
  rows={data}
  getRowKey={(r) => r.name}
/>`}
        >
          <div className="w-full">
            <DataTable
              caption="@neuraforge-ui packages"
              columns={[
                { key: "name", header: "Package", cell: (r: { name: string; version: string; size: string; status: string }) => <code className="text-xs font-mono">{r.name}</code>, rowHeader: true },
                { key: "version", header: "Version", cell: (r: { name: string; version: string; size: string; status: string }) => r.version },
                { key: "size", header: "Size", cell: (r: { name: string; version: string; size: string; status: string }) => r.size, align: "right" as const },
                { key: "status", header: "Status", cell: (r: { name: string; version: string; size: string; status: string }) => <Badge tone="success">{r.status}</Badge> },
              ]}
              rows={[
                { name: "@neuraforge-ui/components", version: "0.1.0", size: "48.2 kB", status: "Live" },
                { name: "@neuraforge-ui/tokens", version: "0.1.0", size: "7.3 kB", status: "Live" },
                { name: "@neuraforge-ui/motion", version: "0.1.0", size: "26.4 kB", status: "Live" },
                { name: "@neuraforge-ui/mcp-core", version: "0.1.0", size: "26.4 kB", status: "Live" },
                { name: "@neuraforge-ui/cli", version: "0.1.0", size: "33.9 kB", status: "Live" },
              ]}
              getRowKey={(r: { name: string }) => r.name}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
