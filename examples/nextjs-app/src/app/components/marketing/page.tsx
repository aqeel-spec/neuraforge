"use client";

import React from "react";
import { ComponentPreview } from "@/components/component-preview";
import { Pricing, Testimonial } from "@neuraforge-ui/components/src/marketing";

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-2">
          Components for marketing pages — Pricing tables and Testimonials.
        </p>
      </div>

      <ComponentPreview
        title="Pricing"
        description="Pricing comparison table with featured tier highlighting"
        code={`import { Pricing } from "@neuraforge-ui/components";

<Pricing
  title="Choose Your Plan"
  plans={[
    { id: "free", name: "Free", price: "$0", description: "...", features: [...], action: {...} },
    { id: "pro", name: "Pro", price: "$29", featured: true, ... },
    { id: "team", name: "Team", price: "$79", ... },
  ]}
/>`}
      >
        <div className="w-full">
          <Pricing
            title="Simple, transparent pricing"
            description="All plans include the full component library. Paid plans add hosted MCP capacity."
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
                cadence: "/month",
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

      <ComponentPreview
        title="Testimonial"
        description="Customer quote with author attribution"
        code={`import { Testimonial } from "@neuraforge-ui/components";

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
    </div>
  );
}
