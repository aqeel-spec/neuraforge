// @ts-nocheck
"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const components = [
  { name: "Infinite Slider", description: "Continuously scrolling content strip with configurable speed and direction" },
  { name: "Scroll Reveal Paragraph", description: "Text that reveals word-by-word or line-by-line on scroll" },
  { name: "Scrollable Card Stack", description: "Stacked cards that fan out as the user scrolls" },
  { name: "Scrollable Hero Sections", description: "Full-viewport hero panels with scroll-snapped transitions" },
  { name: "Per Word Crossfade", description: "Word-level crossfade animation between text variants" },
  { name: "Chroma Blur Transition", description: "Chromatic aberration blur effect for page transitions" },
  { name: "Shader Reveal Transition", description: "WebGL shader-powered content reveal animations" },
  { name: "Scroll Reveal Landing", description: "Landing page sections that animate into view on scroll" },
];

export default function AnimationPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">Animation & Scroll</h1>
        <p className="text-muted-foreground mt-2">
          Scroll-driven animations, page transitions, and motion effects for immersive experiences.
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
