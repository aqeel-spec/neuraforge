"use client";

import React from "react";
import { ComponentPreview } from "@/components/component-preview";
import {
  Container,
  Grid,
  Card,
  Hero,
  Footer,
} from "@neuraforge-ui/components/src/navigation-layout/index";

export default function LayoutPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Layout</h1>
        <p className="text-muted-foreground mt-2">
          Structural components — Container, Grid, Card, Hero, and Footer.
        </p>
      </div>

      <ComponentPreview
        title="Hero"
        description="Full-width hero section with eyebrow, heading, description, and CTA"
        code={`import { Hero } from "@neuraforge-ui/components";

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

      <ComponentPreview
        title="Card"
        description="Content container with title, description, media, and footer slots"
        code={`import { Card } from "@neuraforge-ui/components";

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

      <ComponentPreview
        title="Grid"
        description="Responsive CSS Grid wrapper with column and gap configuration"
        code={`import { Grid } from "@neuraforge-ui/components";

<Grid lgColumns={4} gap="md">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</Grid>`}
      >
        <Grid lgColumns={4} gap="sm">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-md border bg-muted/50 p-4 text-center text-sm font-medium">
              {n}
            </div>
          ))}
        </Grid>
      </ComponentPreview>

      <ComponentPreview
        title="Footer"
        description="Site footer with brand, sections, and legal text"
        code={`import { Footer } from "@neuraforge-ui/components";

<Footer
  brand="NeuraForge"
  description="AI-first component library"
  sections={[{ title: "Links", links: [...] }]}
  legal="© 2026 MIT Licensed"
/>`}
      >
        <div className="w-full rounded-lg overflow-hidden border">
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
    </div>
  );
}
