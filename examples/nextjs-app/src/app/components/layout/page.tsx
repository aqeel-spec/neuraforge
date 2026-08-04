"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import {
  Container,
  Grid,
  Card,
  Hero,
  Footer,
  Accordion,
  Divider,
  Stack,
  AspectRatio,
  Drawer,
  SplitPane,
} from "@neuraforge-ui/components/src/navigation-layout/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LayoutPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Layout</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          11 layout components — structural building blocks including containers, grids, cards,
          heroes, footers, accordions, dividers, stacks, aspect ratios, drawers, and split panes.
        </p>
      </motion.div>

      {/* Hero */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="hero"
          title="Hero"
          description="Full-width hero section with eyebrow, heading, description, and CTA"
          code={`import { Hero } from "@neuraforge-ui/components/src/navigation-layout/index";

<Hero
  title="Build faster with AI"
  description="Ship accessible components without writing markup from scratch."
  eyebrow="NEW RELEASE"
  actions={<a href="/docs">Get Started →</a>}
/>`}
        >
          <div className="w-full rounded-lg overflow-hidden">
            <Hero
              title="Build faster with AI"
              description="Ship accessible components without writing markup from scratch."
              eyebrow="NEW RELEASE"
              align="center"
              actions={
                <a href="#" className="inline-flex items-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
                  Get Started →
                </a>
              }
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Card */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="card"
          title="Card"
          description="Content container with title, description, media, and footer slots"
          code={`import { Card } from "@neuraforge-ui/components/src/navigation-layout/index";

<Card
  title="@neuraforge-ui/components"
  description="20 accessible React + Tailwind components"
/>`}
        >
          <Grid lgColumns={3} gap="md">
            <Card title="Components" description="20 accessible React + Tailwind components across 6 categories." />
            <Card title="Tokens" description="Design tokens with Tailwind theme generation." />
            <Card title="Motion" description="Framer Motion presets with reduced-motion support." />
          </Grid>
        </ComponentPreview>
      </motion.div>

      {/* Grid */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="grid"
          title="Grid"
          description="Responsive CSS Grid wrapper with column and gap configuration"
          code={`import { Grid } from "@neuraforge-ui/components/src/navigation-layout/index";

<Grid lgColumns={4} gap="md">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</Grid>`}
        >
          <Grid lgColumns={4} gap="sm">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-4 text-center text-sm font-medium">
                {n}
              </div>
            ))}
          </Grid>
        </ComponentPreview>
      </motion.div>

      {/* Container */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="container"
          title="Container"
          description="Max-width content wrapper with responsive padding"
          code={`import { Container } from "@neuraforge-ui/components/src/navigation-layout/index";

<Container>
  <p>Content constrained to max-width with auto margins.</p>
</Container>`}
        >
          <Container>
            <div className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Content inside a Container — max-width constrained with responsive padding.
            </div>
          </Container>
        </ComponentPreview>
      </motion.div>

      {/* Footer */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="footer"
          title="Footer"
          description="Site footer with brand, sections, and legal text"
          code={`import { Footer } from "@neuraforge-ui/components/src/navigation-layout/index";

<Footer
  brand="NeuraForge"
  description="AI-first component library"
  sections={[{ title: "Links", links: [{ label: "Docs", href: "/docs" }] }]}
  legal="© 2026 MIT Licensed"
/>`}
        >
          <div className="w-full rounded-lg overflow-hidden border border-[hsl(var(--border))]">
            <Footer
              brand="NeuraForge UI"
              description="A React + Tailwind component library."
              sections={[
                { title: "Resources", links: [{ label: "Docs", href: "#" }, { label: "GitHub", href: "#" }] },
                { title: "Packages", links: [{ label: "Components", href: "#" }, { label: "Tokens", href: "#" }] },
              ]}
              legal="© 2026 NeuraForge. MIT Licensed."
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Accordion */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="accordion"
          title="Accordion"
          description="Collapsible content panels with WAI-ARIA accordion pattern"
          code={`import { Accordion } from "@neuraforge-ui/components/src/navigation-layout/index";

<Accordion
  items={[
    { id: "q1", title: "What is NeuraForge?", content: "A component library..." },
    { id: "q2", title: "Is it free?", content: "Yes, MIT licensed." },
  ]}
/>`}
        >
          <div className="w-full">
            <Accordion
              items={[
                { id: "q1", title: "What is NeuraForge UI?", content: "NeuraForge UI is a React + Tailwind component library designed for AI coding agents to query directly over MCP." },
                { id: "q2", title: "Is it free?", content: "Yes! Every artifact is public, MIT-licensed, and requires no account or license key." },
                { id: "q3", title: "Can I self-host?", content: "Absolutely. Run docker compose up and you have the full registry, API, docs, and MCP server locally." },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Divider */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="divider"
          title="Divider"
          description="Visual separator with optional label for content sections"
          code={`import { Divider } from "@neuraforge-ui/components/src/navigation-layout/index";

<Divider />
<Divider label="OR" />`}
        >
          <div className="w-full space-y-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Content above the divider</p>
            <Divider />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Content below the divider</p>
            <Divider label="OR" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Alternative content section</p>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Stack */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="stack"
          title="Stack"
          description="Flexbox layout helper with configurable direction and gap"
          code={`import { Stack } from "@neuraforge-ui/components/src/navigation-layout/index";

<Stack direction="horizontal" gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>`}
        >
          <Stack direction="horizontal" gap="md">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2 text-sm font-medium">
                Item {n}
              </div>
            ))}
          </Stack>
        </ComponentPreview>
      </motion.div>

      {/* AspectRatio */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="aspect-ratio"
          title="AspectRatio"
          description="Maintains a fixed aspect ratio for media and embedded content"
          code={`import { AspectRatio } from "@neuraforge-ui/components/src/navigation-layout/index";

<AspectRatio ratio={16/9}>
  <img src="..." alt="..." className="object-cover w-full h-full" />
</AspectRatio>`}
        >
          <div className="w-full max-w-sm">
            <AspectRatio ratio={16 / 9}>
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">16:9 Aspect Ratio</span>
              </div>
            </AspectRatio>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Drawer */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="drawer"
          title="Drawer"
          description="Slide-out panel with focus trapping and backdrop overlay"
          code={`import { Drawer } from "@neuraforge-ui/components/src/navigation-layout/index";

<Drawer open={open} onOpenChange={setOpen} title="Settings" side="right">
  <p>Drawer content here</p>
</Drawer>`}
        >
          <div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              Open Drawer
            </button>
            <Drawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              title="Settings"
              side="right"
            >
              <div className="space-y-4 p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  This is a slide-out drawer panel. It traps focus and can be closed with Escape.
                </p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Close
                </button>
              </div>
            </Drawer>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* SplitPane */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="split-pane"
          title="SplitPane"
          description="Resizable split layout with draggable divider"
          code={`import { SplitPane } from "@neuraforge-ui/components/src/navigation-layout/index";

<SplitPane direction="horizontal" defaultSize={50}>
  <div>Left panel</div>
  <div>Right panel</div>
</SplitPane>`}
        >
          <div className="w-full h-[200px]">
            <SplitPane direction="horizontal" defaultSize={50}>
              <div className="h-full flex items-center justify-center bg-[hsl(var(--muted))]/30 p-4">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Left Panel</span>
              </div>
              <div className="h-full flex items-center justify-center bg-[hsl(var(--muted))]/30 p-4">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Right Panel</span>
              </div>
            </SplitPane>
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
