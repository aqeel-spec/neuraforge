// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { Pricing, Testimonial, FeatureGrid, Faq, CallToAction } from "@neuraforge-ui/components/src/marketing";
import { LogoCloud } from "@neuraforge-ui/components/src/marketing/logo-cloud";
import { Newsletter } from "@neuraforge-ui/components/src/marketing/newsletter";
import { SocialProof } from "@neuraforge-ui/components/src/marketing/social-proof";
import { ComparisonTable } from "@neuraforge-ui/components/src/marketing/comparison-table";
import { HeroWithVideo } from "@neuraforge-ui/components/src/marketing/hero-with-video";
import { TeamGrid } from "@neuraforge-ui/components/src/marketing/team-grid";
import { StatsSection } from "@neuraforge-ui/components/src/marketing/stats-section";
import { AnnouncementBar } from "@neuraforge-ui/components/src/marketing/announcement-bar";

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
          13 marketing components — pricing tables, testimonials, feature grids, FAQs, CTAs, logo clouds, newsletters, social proof, comparison tables, hero sections, team grids, stats, and announcement bars for landing pages.
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

      {/* FAQ */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="faq"
          title="FAQ"
          description="Question/answer accordion with accessible details/summary elements"
          code={`import { Faq } from "@neuraforge-ui/components/src/marketing";

<Faq
  title="Frequently Asked Questions"
  items={[
    { id: "q1", question: "Is it free?", answer: "Yes, all components are MIT licensed." },
    { id: "q2", question: "Can I self-host?", answer: "Absolutely." },
  ]}
/>`}
        >
          <div className="w-full max-w-2xl">
            <Faq
              title="Frequently Asked Questions"
              items={[
                {
                  id: "q1",
                  question: "Is NeuraForge UI really free?",
                  answer: "Yes. Every component is MIT-licensed. No account, license key, or paid tier required.",
                },
                {
                  id: "q2",
                  question: "Can I self-host the registry?",
                  answer: "Absolutely. Run docker compose up and you have the full registry, API, docs, and MCP server on your own infrastructure.",
                },
                {
                  id: "q3",
                  question: "How does MCP integration work?",
                  answer: "Your AI coding agent connects to the MCP server and can search, list, and fetch components programmatically — no copy-paste needed.",
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CallToAction */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="call-to-action"
          title="CallToAction"
          description="Full-width CTA banner section with primary and secondary actions"
          code={`import { CallToAction } from "@neuraforge-ui/components/src/marketing";

<CallToAction
  eyebrow="Ready to ship faster?"
  title="Start building with NeuraForge UI"
  description="Install components in seconds, not hours."
  primaryAction={{ label: "Get Started", href: "#" }}
  secondaryAction={{ label: "View Docs", href: "#" }}
/>`}
        >
          <div className="w-full">
            <CallToAction
              eyebrow="Ready to ship faster?"
              title="Start building with NeuraForge UI"
              description="Install accessible, verified components in seconds. Let your AI agents do the heavy lifting."
              primaryAction={{ label: "Get Started Free", href: "#" }}
              secondaryAction={{ label: "Read the Docs", href: "#" }}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* LogoCloud */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="logo-cloud"
          title="LogoCloud"
          description="Grid of partner/client logos with optional grayscale hover effect"
          code={`import { LogoCloud } from "@neuraforge-ui/components/src/marketing/index";

<LogoCloud
  title="Trusted by teams at"
  logos={[
    { name: "Acme", src: "/logos/acme.svg" },
    { name: "Globex", src: "/logos/globex.svg" },
  ]}
  columns={4}
  grayscale
/>`}
        >
          <div className="w-full">
            <LogoCloud
              title="Trusted by leading teams"
              logos={[
                { name: "Acme Corp", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Acme" },
                { name: "Globex", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Globex" },
                { name: "Initech", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Initech" },
                { name: "Umbrella", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Umbrella" },
                { name: "Stark Industries", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Stark" },
                { name: "Wayne Enterprises", src: "https://placehold.co/120x40/e2e8f0/64748b?text=Wayne" },
              ]}
              columns={3}
              grayscale
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Newsletter */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="newsletter"
          title="Newsletter"
          description="Email signup form with validation and status feedback"
          code={`import { Newsletter } from "@neuraforge-ui/components/src/marketing/index";

<Newsletter
  title="Stay in the loop"
  description="Get updates on new components and releases."
  placeholder="you@company.com"
  buttonText="Subscribe"
  disclaimer="No spam. Unsubscribe anytime."
/>`}
        >
          <div className="w-full max-w-md">
            <Newsletter
              title="Stay in the loop"
              description="Get notified when we ship new components, motion presets, and MCP features."
              placeholder="you@company.com"
              buttonText="Subscribe"
              disclaimer="No spam, ever. Unsubscribe with one click."
              onSubmit={async (email) => {
                // Demo: simulate a network delay
                await new Promise((resolve) => setTimeout(resolve, 1000));
                console.log("Subscribed:", email);
              }}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* SocialProof */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="social-proof"
          title="SocialProof"
          description="User count with overlapping avatar bubbles and stat badges"
          code={`import { SocialProof } from "@neuraforge-ui/components/src/marketing/index";

<SocialProof
  avatars={[
    { name: "Alice", src: "/avatars/alice.jpg" },
    { name: "Bob", src: "/avatars/bob.jpg" },
  ]}
  message="Join 10,000+ developers"
  stats={[{ label: "GitHub stars", value: "2.4k", suffix: "+" }]}
/>`}
        >
          <div className="w-full">
            <SocialProof
              avatars={[
                { name: "Alice", src: "https://placehold.co/48x48/c7d2fe/4338ca?text=A" },
                { name: "Bob", src: "https://placehold.co/48x48/c7d2fe/4338ca?text=B" },
                { name: "Charlie", src: "https://placehold.co/48x48/c7d2fe/4338ca?text=C" },
                { name: "Diana", src: "https://placehold.co/48x48/c7d2fe/4338ca?text=D" },
                { name: "Eve", src: "https://placehold.co/48x48/c7d2fe/4338ca?text=E" },
              ]}
              message="Join 10,000+ developers building with NeuraForge UI"
              stats={[
                { label: "GitHub stars", value: "2.4k", suffix: "+" },
                { label: "Weekly downloads", value: "18k", suffix: "+" },
                { label: "Discord members", value: "3.2k" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ComparisonTable */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="comparison-table"
          title="ComparisonTable"
          description="Feature comparison matrix with proper table semantics and highlighted plan"
          code={`import { ComparisonTable } from "@neuraforge-ui/components/src/marketing/index";

<ComparisonTable
  plans={[
    { name: "Free", price: "$0/mo", features: { "Components": true, "MCP Access": true } },
    { name: "Pro", price: "$29/mo", highlighted: true, features: { "Components": true, "MCP Access": true } },
  ]}
  featureGroups={[
    { name: "Core", features: ["Components", "MCP Access"] },
  ]}
/>`}
        >
          <div className="w-full">
            <ComparisonTable
              plans={[
                {
                  name: "Free",
                  price: "$0/mo",
                  features: {
                    "All 20 components": true,
                    "MCP access": true,
                    "Self-hosting": true,
                    "CLI install": true,
                    "Priority support": false,
                    "Custom components": false,
                    "SLA guarantee": false,
                    "Dedicated instance": false,
                  },
                },
                {
                  name: "Pro",
                  price: "$29/mo",
                  highlighted: true,
                  features: {
                    "All 20 components": true,
                    "MCP access": "3,000 req/day",
                    "Self-hosting": true,
                    "CLI install": true,
                    "Priority support": true,
                    "Custom components": "Up to 5",
                    "SLA guarantee": false,
                    "Dedicated instance": false,
                  },
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  features: {
                    "All 20 components": true,
                    "MCP access": "Unlimited",
                    "Self-hosting": true,
                    "CLI install": true,
                    "Priority support": true,
                    "Custom components": "Unlimited",
                    "SLA guarantee": true,
                    "Dedicated instance": true,
                  },
                },
              ]}
              featureGroups={[
                {
                  name: "Core",
                  features: ["All 20 components", "MCP access", "Self-hosting", "CLI install"],
                },
                {
                  name: "Support & Customization",
                  features: ["Priority support", "Custom components", "SLA guarantee", "Dedicated instance"],
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* HeroWithVideo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="hero-with-video"
          title="HeroWithVideo"
          description="Full-width hero section with background video, overlay, and CTA buttons"
          code={`import { HeroWithVideo } from "@neuraforge-ui/components/src/marketing/index";

<HeroWithVideo
  title="Build faster with AI"
  subtitle="Components that your agents can install directly."
  videoSrc="/demo.mp4"
  videoPoster="/poster.jpg"
  actions={[
    { label: "Get Started", href: "#", variant: "primary" },
    { label: "Watch Demo", href: "#", variant: "secondary" },
  ]}
/>`}
        >
          <div className="w-full">
            <HeroWithVideo
              title="Ship UI faster with AI agents"
              subtitle="NeuraForge UI components are built for MCP — your coding agent installs real, tested, accessible components instead of hallucinating markup."
              videoSrc=""
              videoPoster="https://placehold.co/1280x720/1e293b/94a3b8?text=Hero+Video+Poster"
              overlay
              overlayOpacity={0.6}
              actions={[
                { label: "Get Started Free", href: "#", variant: "primary" },
                { label: "View Components", href: "#", variant: "secondary" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* TeamGrid */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="team-grid"
          title="TeamGrid"
          description="Responsive grid of team member cards with photos, roles, and social links"
          code={`import { TeamGrid } from "@neuraforge-ui/components/src/marketing/index";

<TeamGrid
  columns={4}
  members={[
    { name: "Alice", role: "CEO", photo: "/team/alice.jpg" },
    { name: "Bob", role: "CTO", photo: "/team/bob.jpg" },
  ]}
/>`}
        >
          <div className="w-full">
            <TeamGrid
              columns={4}
              members={[
                {
                  name: "Elena Rodriguez",
                  role: "CEO & Co-founder",
                  photo: "https://placehold.co/200x200/e0e7ff/4338ca?text=ER",
                  bio: "Previously led design systems at a Fortune 500 company.",
                  socials: [{ platform: "Twitter", url: "#" }],
                },
                {
                  name: "Marcus Chen",
                  role: "CTO & Co-founder",
                  photo: "https://placehold.co/200x200/e0e7ff/4338ca?text=MC",
                  bio: "Built MCP infrastructure from the ground up.",
                  socials: [{ platform: "GitHub", url: "#" }],
                },
                {
                  name: "Priya Patel",
                  role: "Head of Engineering",
                  photo: "https://placehold.co/200x200/e0e7ff/4338ca?text=PP",
                  bio: "Accessibility expert and React core contributor.",
                  socials: [{ platform: "LinkedIn", url: "#" }],
                },
                {
                  name: "James Okafor",
                  role: "Lead Designer",
                  photo: "https://placehold.co/200x200/e0e7ff/4338ca?text=JO",
                  bio: "Crafts the design tokens and component aesthetics.",
                  socials: [{ platform: "Dribbble", url: "#" }],
                },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* StatsSection */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="stats-section"
          title="StatsSection"
          description="Row of key metrics with semantic dl/dt/dd markup and multiple variants"
          code={`import { StatsSection } from "@neuraforge-ui/components/src/marketing/index";

<StatsSection
  title="NeuraForge by the numbers"
  stats={[
    { value: 10000, label: "Active Users", suffix: "+" },
    { value: "500k", label: "Downloads", suffix: "+" },
  ]}
  variant="card"
/>`}
        >
          <div className="w-full">
            <StatsSection
              title="NeuraForge by the numbers"
              description="Growing every day with developers who trust AI-first tooling."
              variant="card"
              stats={[
                { value: "10k", label: "Active Users", suffix: "+" },
                { value: "500k", label: "Downloads", suffix: "+" },
                { value: 42, label: "Countries" },
                { value: 20, label: "Components" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* AnnouncementBar */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="announcement-bar"
          title="AnnouncementBar"
          description="Sticky promotional bar with dismissible state and color variants"
          code={`import { AnnouncementBar } from "@neuraforge-ui/components/src/marketing/index";

<AnnouncementBar
  message="🎉 v2.0 is here — 10 new components!"
  action={{ label: "See what's new", href: "#" }}
  variant="promo"
  dismissible
/>`}
        >
          <div className="w-full">
            <AnnouncementBar
              message="🎉 NeuraForge UI v2.0 is live — 10 new marketing components, motion presets, and MCP compositions!"
              action={{ label: "See what's new →", href: "#" }}
              variant="promo"
              dismissible
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
