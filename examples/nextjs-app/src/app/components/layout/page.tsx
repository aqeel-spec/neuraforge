// @ts-nocheck
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
  Masonry,
  Carousel,
  Sticky,
  Bento,
  Marquee,
  ParallaxSection,
  Resizable,
} from "@neuraforge-ui/components/src/navigation-layout/index";
import { Popover, Sheet } from "@neuraforge-ui/components/src/feedback/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LayoutPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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
          20 layout components — structural building blocks including containers, grids, cards,
          heroes, footers, accordions, dividers, stacks, aspect ratios, drawers, split panes,
          masonry, carousel, popover, sheet, sticky, bento, marquee, parallax, and resizable panels.
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
          expandable
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

      {/* Masonry */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="masonry"
          title="Masonry"
          description="Pinterest-style masonry grid that positions items of varying heights"
          code={`import { Masonry } from "@neuraforge-ui/components/src/navigation-layout/index";

<Masonry columns={3} gap={16}>
  <div style={{ height: 120 }}>Short</div>
  <div style={{ height: 200 }}>Tall</div>
  <div style={{ height: 160 }}>Medium</div>
</Masonry>`}
        >
          <Masonry columns={3} gap={16}>
            {[120, 200, 160, 180, 140, 220].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium"
              >
                {h}px
              </div>
            ))}
          </Masonry>
        </ComponentPreview>
      </motion.div>

      {/* Carousel */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="carousel"
          title="Carousel"
          description="Swipeable slide carousel with navigation controls and indicators"
          code={`import { Carousel } from "@neuraforge-ui/components/src/navigation-layout/index";

<Carousel>
  <Carousel.Slide>Slide 1</Carousel.Slide>
  <Carousel.Slide>Slide 2</Carousel.Slide>
  <Carousel.Slide>Slide 3</Carousel.Slide>
</Carousel>`}
        >
          <div className="w-full">
            <Carousel>
              {[
                <div key="1" className="h-48 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-lg font-semibold">
                  Slide 1 — Introduction
                </div>,
                <div key="2" className="h-48 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white text-lg font-semibold">
                  Slide 2 — Features
                </div>,
                <div key="3" className="h-48 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center text-white text-lg font-semibold">
                  Slide 3 — Get Started
                </div>,
              ]}
            </Carousel>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Popover */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="popover"
          title="Popover"
          description="Floating panel that appears on click with focus management"
          code={`import { Popover } from "@neuraforge-ui/components/src/feedback/index";

<Popover
  trigger={<button>Open Popover</button>}
  content={<p>Floating panel content</p>}
/>`}
        >
          <Popover
            trigger={
              <button className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity">
                Click for Popover
              </button>
            }
            content={
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">Popover Title</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  This floating panel appears on click and manages focus automatically.
                </p>
              </div>
            }
          />
        </ComponentPreview>
      </motion.div>

      {/* Sheet */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="sheet"
          title="Sheet"
          description="Modal sheet that slides in from an edge of the viewport"
          code={`import { Sheet } from "@neuraforge-ui/components/src/feedback/index";

<Sheet open={open} onOpenChange={setOpen} side="bottom" title="Details">
  <p>Sheet content here</p>
</Sheet>`}
        >
          <div>
            <button
              onClick={() => setSheetOpen(true)}
              className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
            >
              Open Sheet
            </button>
            <Sheet
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              side="bottom"
              title="Details"
            >
              <div className="space-y-4 p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  This sheet slides in from the bottom. It supports top, bottom, left, and right sides.
                </p>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  Close
                </button>
              </div>
            </Sheet>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Sticky */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="sticky"
          title="Sticky"
          description="Wrapper that makes content stick to the viewport edge on scroll"
          code={`import { Sticky } from "@neuraforge-ui/components/src/navigation-layout/index";

<Sticky offset={0}>
  <header>I stay at the top!</header>
</Sticky>`}
        >
          <div className="w-full h-[200px] overflow-y-auto border border-[hsl(var(--border))] rounded-lg">
            <Sticky offset={0}>
              <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-sm font-medium">
                Sticky Header — scroll down ↓
              </div>
            </Sticky>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <p key={n} className="text-sm text-[hsl(var(--muted-foreground))]">
                  Scrollable content block {n}. The header above stays pinned to the top of this container.
                </p>
              ))}
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Bento */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="bento"
          title="Bento"
          description="Bento-style grid with mixed-size cards for feature showcases"
          code={`import { Bento } from "@neuraforge-ui/components/src/navigation-layout/index";

<Bento>
  <Bento.Item colSpan={2} rowSpan={2}>Featured</Bento.Item>
  <Bento.Item>Small 1</Bento.Item>
  <Bento.Item>Small 2</Bento.Item>
</Bento>`}
        >
          <Bento
            items={[
              { id: "featured", colSpan: 2, rowSpan: 2, content: <div className="h-full rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-6 flex items-center justify-center text-white font-semibold">Featured — 2×2</div> },
              { id: "a", content: <div className="h-full rounded-lg bg-[hsl(var(--muted))] p-4 flex items-center justify-center text-sm font-medium">Card A</div> },
              { id: "b", content: <div className="h-full rounded-lg bg-[hsl(var(--muted))] p-4 flex items-center justify-center text-sm font-medium">Card B</div> },
              { id: "wide", colSpan: 2, content: <div className="h-full rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 p-4 flex items-center justify-center text-white text-sm font-medium">Wide — 2×1</div> },
            ]}
          />
        </ComponentPreview>
      </motion.div>

      {/* Marquee */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="marquee"
          title="Marquee"
          description="Infinite horizontal scroll for logos, testimonials, or announcements"
          code={`import { Marquee } from "@neuraforge-ui/components/src/navigation-layout/index";

<Marquee speed={40} pauseOnHover>
  <span>React</span>
  <span>Tailwind</span>
  <span>TypeScript</span>
</Marquee>`}
        >
          <Marquee speed={40} pauseOnHover>
            {["React", "Tailwind CSS", "TypeScript", "Framer Motion", "Next.js", "MCP"].map((text) => (
              <span
                key={text}
                className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-1.5 text-sm font-medium text-[hsl(var(--foreground))]"
              >
                {text}
              </span>
            ))}
          </Marquee>
        </ComponentPreview>
      </motion.div>

      {/* ParallaxSection */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="parallax-section"
          title="ParallaxSection"
          description="Scroll-driven parallax effect with configurable speed and direction"
          code={`import { ParallaxSection } from "@neuraforge-ui/components/src/navigation-layout/index";

<ParallaxSection speed={0.5}>
  <div className="h-64 bg-gradient-to-b from-sky-400 to-blue-600" />
</ParallaxSection>`}
        >
          <div className="w-full h-[200px] overflow-hidden rounded-lg">
            <ParallaxSection speed={0.5}>
              <div className="h-64 bg-gradient-to-b from-sky-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">Scroll for parallax effect</span>
              </div>
            </ParallaxSection>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Resizable */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="resizable"
          title="Resizable"
          description="Panel with drag handles for user-controlled resizing"
          code={`import { Resizable } from "@neuraforge-ui/components/src/navigation-layout/index";

<Resizable minWidth={200} maxWidth={600} minHeight={100} maxHeight={400}>
  <div>Drag the edges to resize</div>
</Resizable>`}
        >
          <Resizable minWidth={200} maxWidth={600} minHeight={100} maxHeight={300}>
            <div className="w-full h-full rounded-lg border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 flex items-center justify-center p-4">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Drag edges to resize this panel
              </span>
            </div>
          </Resizable>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
