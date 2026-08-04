// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { HeroGradient } from "@neuraforge-ui/components/src/blocks/hero-gradient";
import { HeroMinimal } from "@neuraforge-ui/components/src/blocks/hero-minimal";
import { HeroSplit } from "@neuraforge-ui/components/src/blocks/hero-split";
import { TestimonialMarquee } from "@neuraforge-ui/components/src/blocks/testimonial-marquee";
import { StatsAnimated } from "@neuraforge-ui/components/src/blocks/stats-animated";
import { FeatureBento } from "@neuraforge-ui/components/src/blocks/feature-bento";
import { PricingGradient } from "@neuraforge-ui/components/src/blocks/pricing-gradient";
import { Page404 } from "@neuraforge-ui/components/src/blocks/page-404";
import { NewsletterCTA } from "@neuraforge-ui/components/src/blocks/newsletter-cta";
import { FAQAccordion } from "@neuraforge-ui/components/src/blocks/faq-accordion";

const testimonials = [
  {
    quote: "NeuraForge cut our frontend development time in half. The components just work.",
    author: "Sarah Chen",
    role: "Lead Engineer at Vercel",
  },
  {
    quote: "Finally a component library that my AI coding agent can actually use reliably.",
    author: "Marcus Johnson",
    role: "CTO at LaunchPad",
  },
  {
    quote: "The MCP integration is a game changer. Our agents ship pixel-perfect UIs now.",
    author: "Priya Sharma",
    role: "Staff Engineer at Stripe",
  },
  {
    quote: "We migrated from shadcn in a weekend. Zero regressions, better accessibility.",
    author: "Alex Rivera",
    role: "Frontend Lead at Linear",
  },
];

const stats = [
  { value: "10K+", label: "Developers" },
  { value: "200+", label: "Components" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "Rating" },
];

const features = [
  {
    title: "MCP Native",
    description:
      "AI agents query components directly over the Model Context Protocol. No copy-paste needed.",
  },
  {
    title: "Integrity Verified",
    description:
      "Every component is SHA-256 checksummed. What you get is exactly what was published.",
  },
  {
    title: "Accessible by Default",
    description:
      "WCAG 2.2 AA compliant, keyboard navigable, and reduced-motion safe out of the box.",
  },
  {
    title: "Self-Hostable",
    description:
      "Run the entire registry offline with docker compose. No account or license key required.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "All 200+ components",
      "MIT licensed",
      "Community support",
      "Self-hosting",
    ],
    cta: { label: "Get Started", href: "#" },
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Everything in Free",
      "Priority support",
      "Advanced compositions",
      "Team tokens sync",
    ],
    cta: { label: "Start Trial", href: "#" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Dedicated SLA",
      "Custom components",
      "On-premise deploy",
    ],
    cta: { label: "Contact Sales", href: "#" },
  },
];

const faqItems = [
  {
    question: "Is NeuraForge UI really free?",
    answer:
      "Yes. Every component is MIT licensed and available without an account. The optional hosted service only sells managed capacity — it never restricts what you can self-host.",
  },
  {
    question: "How does the MCP integration work?",
    answer:
      "AI agents connect to the NeuraForge MCP server and call operations like search_components or get_component. They receive exact source code, dependencies, and install steps — no hallucination.",
  },
  {
    question: "Can I use this with my existing design system?",
    answer:
      "Absolutely. Components use design tokens that you can override. Swap the token set to match your brand and every component adapts automatically.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function BlocksPage() {
  return (
    <motion.div
      className="space-y-16 py-12 px-4 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold mb-2">Blocks</h1>
        <p className="text-muted-foreground text-lg">
          Pre-built page sections ready to drop into your project. Each block is
          a complete, accessible composition.
        </p>
      </motion.div>

      {/* Hero Gradient */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="HeroGradient" category="hero">
          <HeroGradient
            title="Build faster with AI"
            subtitle="100+ components"
            cta={{ label: "Get Started", href: "#" }}
          />
        </ComponentPreview>
      </motion.div>

      {/* Hero Minimal */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="HeroMinimal" category="hero">
          <HeroMinimal
            title="Simple. Powerful. Yours."
            subtitle="MIT licensed"
            cta={{ label: "Explore", href: "#" }}
          />
        </ComponentPreview>
      </motion.div>

      {/* Hero Split */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="HeroSplit" category="hero">
          <HeroSplit
            title="Ship in hours"
            subtitle="Not weeks"
            imageSrc="https://placehold.co/600x400/6366f1/white?text=Preview"
            cta={{ label: "Start Free", href: "#" }}
          />
        </ComponentPreview>
      </motion.div>

      {/* Testimonial Marquee */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="TestimonialMarquee" category="social-proof">
          <TestimonialMarquee testimonials={testimonials} />
        </ComponentPreview>
      </motion.div>

      {/* Stats Animated */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="StatsAnimated" category="data-display">
          <StatsAnimated stats={stats} />
        </ComponentPreview>
      </motion.div>

      {/* Feature Bento */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="FeatureBento" category="features">
          <FeatureBento features={features} />
        </ComponentPreview>
      </motion.div>

      {/* Pricing Gradient */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="PricingGradient" category="pricing">
          <PricingGradient plans={pricingPlans} />
        </ComponentPreview>
      </motion.div>

      {/* Newsletter CTA */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="NewsletterCTA" category="cta">
          <NewsletterCTA
            title="Stay updated"
            description="Get weekly component drops"
          />
        </ComponentPreview>
      </motion.div>

      {/* FAQ Accordion */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="FAQAccordion" category="content">
          <FAQAccordion title="FAQ" items={faqItems} />
        </ComponentPreview>
      </motion.div>

      {/* Page 404 */}
      <motion.div variants={itemVariants}>
        <ComponentPreview name="Page404" category="utility">
          <Page404
            title="404"
            message="Page not found"
            cta={{ label: "Go Home", href: "/" }}
          />
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
