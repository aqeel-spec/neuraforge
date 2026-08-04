// @ts-nocheck
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import {
  Chart,
} from "@neuraforge-ui/components/src/data-display/chart";
import {
  CodeBlock,
} from "@neuraforge-ui/components/src/data-display/code-block";
import {
  CopyButton,
} from "@neuraforge-ui/components/src/data-display/copy-button";
import {
  CountUp,
} from "@neuraforge-ui/components/src/data-display/count-up";
import {
  List,
} from "@neuraforge-ui/components/src/data-display/list";
import {
  TreeView,
  Kanban,
  InfiniteScroll,
  VirtualList,
} from "@neuraforge-ui/components/src/navigation-layout";

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
          20 data display components — tables, stats, badges, avatars, tags, timelines, tooltips,
          keyboard indicators, charts, code blocks, copy buttons, counters, lists, tree views,
          kanban boards, infinite scroll, and virtualized lists. Built for presenting information clearly.
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
          expandable
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

      {/* Chart */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="chart"
          title="Chart"
          description="Responsive charting component with multiple chart types and accessible color palettes"
          code={`import { Chart } from "@neuraforge-ui/components/src/data-display";

<Chart
  type="bar"
  data={[
    { label: "Jan", value: 4200 },
    { label: "Feb", value: 5800 },
    { label: "Mar", value: 7100 },
    { label: "Apr", value: 6400 },
    { label: "May", value: 8900 },
    { label: "Jun", value: 11200 },
  ]}
  title="Monthly Sales"
  yAxisLabel="Revenue ($)"
/>`}
        >
          <div className="w-full">
            <Chart
              type="bar"
              data={[
                { label: "Jan", value: 4200 },
                { label: "Feb", value: 5800 },
                { label: "Mar", value: 7100 },
                { label: "Apr", value: 6400 },
                { label: "May", value: 8900 },
                { label: "Jun", value: 11200 },
              ]}
              title="Monthly Sales"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CodeBlock */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="code-block"
          title="CodeBlock"
          description="Syntax-highlighted code display with line numbers, copy button, and language indicator"
          code={`import { CodeBlock } from "@neuraforge-ui/components/src/data-display";

<CodeBlock
  language="typescript"
  showLineNumbers
  title="hello.ts"
  code={\`import { greet } from "./utils";

const message = greet("NeuraForge");
console.log(message); // Hello, NeuraForge!\`}
/>`}
        >
          <div className="w-full">
            <CodeBlock
              language="typescript"
              showLineNumbers
              title="hello.ts"
              code={`import { greet } from "./utils";

const message = greet("NeuraForge");
console.log(message); // Hello, NeuraForge!`}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CopyButton */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="copy-button"
          title="CopyButton"
          description="One-click copy to clipboard with confirmation feedback and accessible labeling"
          code={`import { CopyButton } from "@neuraforge-ui/components/src/data-display";

<CopyButton text="npm install @neuraforge-ui/components" />
<CopyButton text="npx @neuraforge-ui/cli install pricing@1.0.0" label="Copy CLI command" />`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2">
              <code className="text-sm font-mono flex-1">npm install @neuraforge-ui/components</code>
              <CopyButton text="npm install @neuraforge-ui/components" />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2">
              <code className="text-sm font-mono flex-1">npx @neuraforge-ui/cli install pricing@1.0.0</code>
              <CopyButton text="npx @neuraforge-ui/cli install pricing@1.0.0" label="Copy CLI command" />
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CountUp */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="count-up"
          title="CountUp"
          description="Animated number counter that increments from start to end value on scroll into view"
          code={`import { CountUp } from "@neuraforge-ui/components/src/data-display/count-up";

<CountUp start={0} end={10000} duration={2000} separator="," />
<CountUp start={0} end={99.9} duration={1500} decimals={1} suffix="%" />`}
        >
          <div className="flex flex-wrap gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[hsl(var(--foreground))]">
                <CountUp start={0} end={10000} duration={2000} separator="," />
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Downloads</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[hsl(var(--foreground))]">
                <CountUp start={0} end={99.9} duration={1500} decimals={1} suffix="%" />
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[hsl(var(--foreground))]">
                <CountUp start={0} end={420} duration={1800} prefix="$" suffix="k" />
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Revenue</p>
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* List */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="list"
          title="List"
          description="Structured list component for settings, menus, and data items with optional actions"
          code={`import { List } from "@neuraforge-ui/components/src/data-display";

<List
  items={[
    { id: "theme", label: "Theme", description: "Light, Dark, or System", value: "System" },
    { id: "lang", label: "Language", description: "Interface language", value: "English" },
    { id: "notifications", label: "Notifications", description: "Email & push settings", value: "Enabled" },
  ]}
/>`}
        >
          <div className="w-full max-w-md">
            <List
              items={[
                { id: "theme", label: "Theme", description: "Light, Dark, or System" },
                { id: "lang", label: "Language", description: "Interface language" },
                { id: "notifications", label: "Notifications", description: "Email & push settings" },
                { id: "privacy", label: "Privacy", description: "Data sharing & telemetry" },
                { id: "storage", label: "Storage", description: "Cache and local data — 1.2 GB" },
              ]}
              variant="bordered"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* TreeView */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="tree-view"
          title="TreeView"
          description="Hierarchical tree component for file explorers, navigation, and nested data structures"
          code={`import { TreeView } from "@neuraforge-ui/components/src/navigation-layout";

<TreeView
  data={[
    { id: "src", label: "src/", children: [
      { id: "components", label: "components/", children: [
        { id: "button", label: "Button.tsx" },
        { id: "card", label: "Card.tsx" },
      ]},
      { id: "app", label: "app/", children: [
        { id: "page", label: "page.tsx" },
        { id: "layout", label: "layout.tsx" },
      ]},
    ]},
    { id: "package", label: "package.json" },
    { id: "tsconfig", label: "tsconfig.json" },
  ]}
/>`}
        >
          <div className="w-full max-w-sm">
            <TreeView
              data={[
                { id: "src", label: "src/", children: [
                  { id: "components", label: "components/", children: [
                    { id: "button", label: "Button.tsx" },
                    { id: "card", label: "Card.tsx" },
                    { id: "dialog", label: "Dialog.tsx" },
                  ]},
                  { id: "app", label: "app/", children: [
                    { id: "page", label: "page.tsx" },
                    { id: "layout", label: "layout.tsx" },
                  ]},
                  { id: "utils", label: "utils/", children: [
                    { id: "cn", label: "cn.ts" },
                    { id: "hooks", label: "hooks.ts" },
                  ]},
                ]},
                { id: "package", label: "package.json" },
                { id: "tsconfig", label: "tsconfig.json" },
                { id: "readme", label: "README.md" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Kanban */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="kanban"
          title="Kanban"
          description="Drag-and-drop kanban board with configurable columns and card rendering"
          code={`import { Kanban } from "@neuraforge-ui/components/src/navigation-layout";

<Kanban
  columns={[
    { id: "todo", title: "To Do", cards: [
      { id: "1", title: "Design tokens audit", tag: "Design" },
      { id: "2", title: "Add Chart component", tag: "Feature" },
    ]},
    { id: "progress", title: "In Progress", cards: [
      { id: "3", title: "MCP search ranking", tag: "Backend" },
    ]},
    { id: "done", title: "Done", cards: [
      { id: "4", title: "Badge tone system", tag: "Component" },
      { id: "5", title: "CLI rollback", tag: "Feature" },
    ]},
  ]}
/>`}
        >
          <div className="w-full overflow-x-auto">
            <Kanban
              columns={[
                { id: "todo", title: "To Do", cards: [
                  { id: "1", title: "Design tokens audit", description: "Design" },
                  { id: "2", title: "Add Chart component", description: "Feature" },
                  { id: "6", title: "Accessibility review", description: "QA" },
                ]},
                { id: "progress", title: "In Progress", cards: [
                  { id: "3", title: "MCP search ranking", description: "Backend" },
                  { id: "7", title: "TreeView keyboard nav", description: "Component" },
                ]},
                { id: "done", title: "Done", cards: [
                  { id: "4", title: "Badge tone system", description: "Component" },
                  { id: "5", title: "CLI rollback", description: "Feature" },
                ]},
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* InfiniteScroll */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="infinite-scroll"
          title="InfiniteScroll"
          description="Automatically loads more content as the user scrolls, with loading indicator and end detection"
          code={`import { InfiniteScroll } from "@neuraforge-ui/components/src/navigation-layout";

<InfiniteScroll onLoadMore={() => fetchNextPage()} hasMore={hasMore}>
  {items.map(item => <div key={item.id}>{item.title}</div>)}
</InfiniteScroll>`}
        >
          <div className="w-full max-w-md h-64 overflow-auto rounded-md border border-[hsl(var(--border))]">
            <InfiniteScroll
              onLoadMore={() => {}}
              hasMore={false}
              loading={false}
            >
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="px-4 py-3 border-b border-[hsl(var(--border))] last:border-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">Item {i + 1}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Description for item {i + 1}</p>
                </div>
              ))}
            </InfiniteScroll>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* VirtualList */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="virtual-list"
          title="VirtualList"
          description="Renders only visible items for high-performance lists with thousands of rows"
          code={`import { VirtualList } from "@neuraforge-ui/components/src/navigation-layout";

<VirtualList
  items={Array.from({ length: 1000 }, (_, i) => ({ id: i, label: \`Row \${i + 1}\` }))}
  itemHeight={40}
  containerHeight={300}
  renderItem={(item) => <div>{item.label}</div>}
/>`}
        >
          <div className="w-full max-w-md">
            <VirtualList
              items={Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                label: `Row ${i + 1}`,
              }))}
              itemHeight={48}
              height={300}
              renderItem={(item: { id: number; label: string }) => (
                <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Virtual row #{item.id}</span>
                </div>
              )}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
