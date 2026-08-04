"use client";

import React from "react";
import { ComponentPreview } from "@/components/component-preview";
import { DataTable, Stat, Badge } from "@neuraforge-ui/components/src/data-display";

export default function DataDisplayPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Display</h1>
        <p className="text-muted-foreground mt-2">
          Components for presenting data — DataTable, Stat, and Badge.
        </p>
      </div>

      <ComponentPreview
        title="Badge"
        description="Inline status indicator with 5 tones"
        code={`import { Badge } from "@neuraforge-ui/components";

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

      <ComponentPreview
        title="Stat"
        description="Key metric display with label, value, description, and trend"
        code={`import { Stat } from "@neuraforge-ui/components";

<Stat label="Downloads" value="12,847" trend={{ direction: "up", label: "+23%" }} />
<Stat label="Components" value="20" description="across 6 categories" />`}
      >
        <div className="flex flex-wrap gap-4">
          <Stat label="Downloads" value="12,847" trend={{ direction: "up", label: "+23%" }} />
          <Stat label="Components" value="20" description="across 6 categories" />
          <Stat label="Test Coverage" value="892" description="tests passing" trend={{ direction: "up", label: "100%" }} />
        </div>
      </ComponentPreview>

      <ComponentPreview
        title="DataTable"
        description="Accessible data table with caption, column alignment, and row headers"
        code={`import { DataTable } from "@neuraforge-ui/components";

<DataTable
  caption="Published packages"
  columns={[
    { key: "name", header: "Package", cell: (r) => r.name, rowHeader: true },
    { key: "version", header: "Version", cell: (r) => r.version },
    { key: "size", header: "Size", cell: (r) => r.size, align: "right" },
  ]}
  rows={data}
  getRowKey={(r) => r.name}
/>`}
      >
        <div className="w-full">
          <DataTable
            caption="@neuraforge-ui packages"
            columns={[
              { key: "name", header: "Package", cell: (r: { name: string; version: string; size: string; status: string }) => <code className="text-xs">{r.name}</code>, rowHeader: true },
              { key: "version", header: "Version", cell: (r: { name: string; version: string; size: string; status: string }) => r.version },
              { key: "size", header: "Size", cell: (r: { name: string; version: string; size: string; status: string }) => r.size, align: "right" as const },
              { key: "status", header: "Status", cell: (r: { name: string; version: string; size: string; status: string }) => <Badge tone="success">{r.status}</Badge> },
            ]}
            rows={[
              { name: "@neuraforge-ui/components", version: "0.1.0", size: "40.9 kB", status: "Live" },
              { name: "@neuraforge-ui/tokens", version: "0.1.0", size: "7.3 kB", status: "Live" },
              { name: "@neuraforge-ui/motion", version: "0.1.0", size: "26.4 kB", status: "Live" },
              { name: "@neuraforge-ui/mcp-core", version: "0.1.0", size: "26.4 kB", status: "Live" },
              { name: "@neuraforge-ui/cli", version: "0.1.0", size: "33.9 kB", status: "Live" },
            ]}
            getRowKey={(r: { name: string }) => r.name}
          />
        </div>
      </ComponentPreview>
    </div>
  );
}
