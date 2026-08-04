// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { InfiniteSlider } from "@neuraforge-ui/components/src/animation/infinite-slider";
import { PerWordCrossfade } from "@neuraforge-ui/components/src/animation/per-word-crossfade";
import { ChromaBlurTransition } from "@neuraforge-ui/components/src/animation/chroma-blur-transition";
import { ShaderRevealTransition } from "@neuraforge-ui/components/src/animation/shader-reveal-transition";
import { ScrollRevealParagraph } from "@neuraforge-ui/components/src/animation/scroll-reveal-paragraph";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const techBadges = [
  "React",
  "Tailwind",
  "TypeScript",
  "Next.js",
  "Framer Motion",
  "MCP",
];

const crossfadeWords = ["innovative", "accessible", "beautiful", "performant"];

export default function AnimationPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-10"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">Animation & Scroll</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">
          Scroll-driven animations, page transitions, and motion effects for
          immersive experiences.
        </p>
      </motion.div>

      {/* InfiniteSlider Demo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="infinite-slider"
          title="Infinite Slider"
          description="Continuously scrolling content strip with configurable speed and direction."
          code={`import { InfiniteSlider } from "@neuraforge-ui/components/src/animation/infinite-slider";

<InfiniteSlider speed={40} direction="left" pauseOnHover>
  {["React", "Tailwind", "TypeScript", "Next.js", "Framer Motion", "MCP"].map(
    (badge) => (
      <span
        key={badge}
        className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
      >
        {badge}
      </span>
    )
  )}
</InfiniteSlider>`}
        >
          <InfiniteSlider speed={40} direction="left" pauseOnHover>
            {techBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-full bg-[hsl(var(--primary))]/10 px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] whitespace-nowrap"
              >
                {badge}
              </span>
            ))}
          </InfiniteSlider>
        </ComponentPreview>
      </motion.div>

      {/* PerWordCrossfade Demo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="per-word-crossfade"
          title="Per Word Crossfade"
          description="Word-level crossfade animation cycling through text variants."
          code={`import { PerWordCrossfade } from "@neuraforge-ui/components/src/animation/per-word-crossfade";

<PerWordCrossfade
  words={["innovative", "accessible", "beautiful", "performant"]}
  interval={2500}
  className="text-4xl font-bold text-primary"
/>`}
        >
          <div className="flex items-center justify-center py-6">
            <span className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              NeuraForge is{" "}
            </span>
            <PerWordCrossfade
              words={crossfadeWords}
              interval={2500}
              className="text-2xl font-bold text-[hsl(var(--primary))] ml-2"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ChromaBlurTransition Demo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="chroma-blur-transition"
          title="Chroma Blur Transition"
          description="Chromatic aberration blur effect as a visual divider between sections."
          expandable
          code={`import { ChromaBlurTransition } from "@neuraforge-ui/components/src/animation/chroma-blur-transition";

<div className="rounded-lg overflow-hidden">
  <div className="bg-indigo-600 p-8 text-white text-center">
    <p className="font-semibold">Section A</p>
  </div>
  <ChromaBlurTransition intensity={0.6} />
  <div className="bg-emerald-600 p-8 text-white text-center">
    <p className="font-semibold">Section B</p>
  </div>
</div>`}
        >
          <div className="rounded-lg overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white text-center">
              <p className="font-semibold text-lg">Section A — Indigo</p>
              <p className="text-indigo-200 text-sm mt-1">
                Content above the transition
              </p>
            </div>
            <ChromaBlurTransition intensity={0.6} />
            <div className="bg-emerald-600 p-8 text-white text-center">
              <p className="font-semibold text-lg">Section B — Emerald</p>
              <p className="text-emerald-200 text-sm mt-1">
                Content below the transition
              </p>
            </div>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ShaderRevealTransition Demo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="shader-reveal-transition"
          title="Shader Reveal Transition"
          description="WebGL shader-powered content reveal with directional wipe."
          code={`import { ShaderRevealTransition } from "@neuraforge-ui/components/src/animation/shader-reveal-transition";

<ShaderRevealTransition direction="left" duration={1.2} triggerOnView>
  <h2 className="text-3xl font-bold">
    Built for the future of development
  </h2>
</ShaderRevealTransition>`}
        >
          <div className="py-6 flex items-center justify-center">
            <ShaderRevealTransition direction="left" duration={1.2} triggerOnView>
              <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] text-center">
                Built for the future of development
              </h2>
            </ShaderRevealTransition>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ScrollRevealParagraph Demo */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="scroll-reveal-paragraph"
          title="Scroll Reveal Paragraph"
          description="Text that reveals word-by-word as the user scrolls into view."
          expandable
          code={`import { ScrollRevealParagraph } from "@neuraforge-ui/components/src/animation/scroll-reveal-paragraph";

<ScrollRevealParagraph
  text="NeuraForge UI is a React component library designed for AI coding agents. Components are discoverable over MCP, verified by checksum, and installed transactionally with full rollback support. No hallucinated markup — just real, tested, accessible components every time."
  staggerDelay={0.03}
/>`}
        >
          <div className="py-4">
            <ScrollRevealParagraph
              text="NeuraForge UI is a React component library designed for AI coding agents. Components are discoverable over MCP, verified by checksum, and installed transactionally with full rollback support. No hallucinated markup — just real, tested, accessible components every time."
              staggerDelay={0.03}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Skipped Components Note */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-6">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Additional Animation Components
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            <strong>ScrollableCardStack</strong>,{" "}
            <strong>ScrollableHeroSections</strong>, and{" "}
            <strong>ScrollRevealLanding</strong> require full-page scroll
            context and are best previewed in a dedicated route.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
