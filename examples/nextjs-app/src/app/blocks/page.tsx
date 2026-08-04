// @ts-nocheck
"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const components = [
  { name: "Hero Gradient", description: "Full-width hero section with animated gradient background" },
  { name: "Hero Split", description: "Two-column hero with text and media side by side" },
  { name: "Hero Video", description: "Hero section with background video and overlay content" },
  { name: "Hero Minimal", description: "Clean, minimal hero with centered text and subtle animation" },
  { name: "Hero Animated", description: "Hero with complex entrance animations and particle effects" },
  { name: "Testimonial Marquee", description: "Continuously scrolling testimonial cards in a marquee" },
  { name: "CTA Orbiting", description: "Call-to-action with orbiting decorative elements" },
  { name: "Feature Bento", description: "Bento grid layout showcasing features in varied card sizes" },
  { name: "Feature Cards", description: "Standard feature cards with icons and descriptions" },
  { name: "Pricing Gradient", description: "Pricing table with gradient accents and popular plan highlight" },
  { name: "Footer Mega", description: "Multi-column mega footer with newsletter and social links" },
  { name: "About Team", description: "Team section with photo grid and role descriptions" },
  { name: "Contact Split", description: "Split-layout contact page with form and info panel" },
  { name: "Blog Grid", description: "Responsive blog post grid with featured article highlight" },
  { name: "Stats Animated", description: "Animated statistics counters with scroll-triggered effects" },
  { name: "Team Carousel", description: "Swipeable team member carousel with bio cards" },
  { name: "Newsletter CTA", description: "Focused newsletter signup block with email input" },
  { name: "FAQ Accordion", description: "Expandable FAQ section with smooth open/close animations" },
  { name: "Login Split", description: "Split-screen login page with branding and form" },
  { name: "Page 404", description: "Creative 404 error page with navigation back to home" },
];

export default function BlocksPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">Blocks</h1>
        <p className="text-muted-foreground mt-2">
          Pre-built page sections and layouts ready to drop into any project. Heroes, footers, pricing, and more.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp) => (
          <motion.div
            key={comp.name}
            variants={fadeUp}
            className="rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-[hsl(var(--foreground))]">{comp.name}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{comp.description}</p>
            <div className="mt-4 rounded-lg bg-[hsl(var(--muted))] p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Interactive demo coming soon
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
