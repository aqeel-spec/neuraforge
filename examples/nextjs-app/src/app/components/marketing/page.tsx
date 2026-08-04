"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { Pricing, Testimonial, FeatureGrid } from "@neuraforge-ui/components/src/marketing";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function MarketingPage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Marketing</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          3 marketing components — pricing tables, testimonials, and feature grids for landing pages.
        </p>
      </motion.div>

      {/* Pricing */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="pricing"
          title="Pricing"
          description="Pricing comparison table with featured tier highlighting"
          code={`import { Pricing } from "@neuraforge-ui/components/src/marketing";

<Pricing
  title="Choose Your Plan"
  plans={[
    { id: "free", name: "Free", price: "$0", description: "...", features: [...], action: { label: "Get Started", href: "#" } },
    { id: "pro", name: "Pro", price: "$29", featured: true, ... },
  ]}
/>`}
        >
          <div className="w-full">
            <Pricing
              title="Simple, transparent pricing"
              plans={[
                {
                  id: "free",
                  name: "Free",
                  price: "$0",
                  description: "For personal projects",
                  features: ["All 20 components", "MIT License", "Self-hosting", "CLI access"],
                  action: { label: "Get Started", href: "#" },
                },
                {
                  id: "pro",
                  name: "Pro",
                  price: "$29",
                  description: "For teams",
                  features: ["Everything in Free", "3,000 MCP req/day", "Priority support", "Analytics"],
                  action: { label: "Subscribe", href: "#" },
                  featured: true,
                },
                {
                  id: "enterprise",
                  name: "Enterprise",
                  price: "Custom",
                  description: "For organizations",
                  features: ["Everything in Pro", "Unlimited requests", "SLA", "Dedicated instance"],
                  action: { label: "Contact Sales", href: "#" },
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Testimonial */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="testimonial"
          title="Testimonial"
          description="Customer quote with author attribution"
          code={`import { Testimonial } from "@neuraforge-ui/components/src/marketing";

<Testimonial
  quote="NeuraForge saved us weeks of work."
  author="Alex Chen"
  role="Engineering Lead"
/>`}
        >
          <div className="w-full max-w-lg">
            <Testimonial
              quote="NeuraForge UI changed how we ship frontend. Our agents produce consistent, accessible markup every time — no more fixing hallucinated components."
              author="Sarah Kim"
              role="VP Engineering at TechCorp"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* FeatureGrid */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="feature-grid"
          title="FeatureGrid"
          description="Grid layout for showcasing product features with titles and descriptions"
          code={`import { FeatureGrid } from "@neuraforge-ui/components/src/marketing";

<FeatureGrid
  title="Why NeuraForge?"
  features={[
    { title: "AI-First", description: "Built for coding agents, not copy-paste." },
    { title: "Accessible", description: "WCAG 2.2 AA out of the box." },
    { title: "Verified", description: "SHA-256 checksums on every artifact." },
  ]}
  columns={3}
/>`}
        >
          <div className="w-full">
            <FeatureGrid
              title="Why NeuraForge UI?"
              features={[
                { id: "ai", title: "AI-First Design", description: "Built for coding agents to query over MCP — not for copy-paste workflows." },
                { id: "a11y", title: "WCAG 2.2 AA", description: "Every component is accessible, keyboard navigable, and reduced-motion safe." },
                { id: "integrity", title: "Integrity Verified", description: "SHA-256 checksums ensure you get the exact same artifact every time." },
                { id: "selfhost", title: "Self-Hostable", description: "Run the full stack locally with docker compose. No account needed." },
                { id: "versions", title: "Exact Versions", description: "No 'latest' drift. Every component has an immutable published version." },
                { id: "mit", title: "MIT Licensed", description: "Every artifact is public and yours. No license keys or paid tiers for components." },
              ]}
              columns={3}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
