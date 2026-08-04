// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { DynamicIsland } from "@neuraforge-ui/components/src/interactive/dynamic-island";
import { PowerOffSlide } from "@neuraforge-ui/components/src/interactive/power-off-slide";
import { Flip } from "@neuraforge-ui/components/src/interactive/flip";
import { ImageZoom } from "@neuraforge-ui/components/src/interactive/image-zoom";
import { CursorFollow } from "@neuraforge-ui/components/src/interactive/cursor-follow";
import { MusicPlayer, VideoPlayer } from "@neuraforge-ui/components/src/interactive/liquid-glass";
import { MouseEffectCard } from "@neuraforge-ui/components/src/interactive/mouse-effect-card";
import { SpotlightCards } from "@neuraforge-ui/components/src/interactive/spotlight-cards";

export default function InteractivePage() {
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 space-y-12">
      <motion.h1
        className="text-4xl font-bold text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Interactive Components
      </motion.h1>
      <p className="text-center text-zinc-400 max-w-2xl mx-auto">
        Live demos of NeuraForge interactive components. Each one is fully
        accessible, animated with Framer Motion, and reduced-motion safe.
      </p>

      {/* Dynamic Island */}
      <ComponentPreview
        title="DynamicIsland"
        description="A morphing container that expands/collapses to reveal content."
      >
        <div className="flex flex-col items-center gap-4">
          <DynamicIsland expanded={islandExpanded}>
            {islandExpanded ? (
              <div className="p-4 text-center">
                <p className="text-sm font-medium">Now Playing</p>
                <p className="text-xs text-zinc-400">NeuraForge — Ambient Loop</p>
              </div>
            ) : (
              <div className="px-4 py-2 text-xs text-zinc-300">Compact</div>
            )}
          </DynamicIsland>
          <button
            onClick={() => setIslandExpanded((prev) => !prev)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors"
          >
            {islandExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </ComponentPreview>

      {/* Power Off Slide */}
      <ComponentPreview
        title="PowerOffSlide"
        description="Slide to confirm an action — mimics iOS power-off gesture."
      >
        <div className="flex flex-col items-center gap-4">
          {confirmed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-green-400 font-semibold text-lg"
            >
              ✓ Confirmed!
            </motion.div>
          ) : (
            <PowerOffSlide
              onConfirm={() => setConfirmed(true)}
              label="Slide to confirm"
            />
          )}
          {confirmed && (
            <button
              onClick={() => setConfirmed(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </ComponentPreview>

      {/* Flip Card */}
      <ComponentPreview
        title="Flip"
        description="Premium 3D card flip on hover — reveals features and CTA with staggered animations."
      >
        <div className="flex justify-center gap-6 flex-wrap">
          <Flip
            title="AI Components"
            subtitle="Build intelligent interfaces"
            description="13 purpose-built components for chat, reasoning, and agent workflows."
            features={["Chat Interface", "Streaming Response", "Tool Call Display", "Context Meter"]}
            ctaText="Explore AI"
            accentColor="violet"
          />
          <Flip
            title="Premium Blocks"
            subtitle="Full page sections"
            description="20 ready-to-use landing page blocks with animations."
            features={["Hero Sections x5", "Pricing Gradient", "Testimonial Marquee", "FAQ Accordion"]}
            ctaText="View Blocks"
            accentColor="cyan"
          />
        </div>
      </ComponentPreview>

      {/* Image Zoom */}
      <ComponentPreview
        title="ImageZoom"
        description="Hover or pinch to zoom into an image smoothly."
      >
        <div className="flex justify-center">
          <ImageZoom
            src="https://placehold.co/400x300/6366f1/white?text=Zoom+Me"
            alt="Zoomable placeholder image"
            className="rounded-xl w-[400px] h-[300px] object-cover"
          />
        </div>
      </ComponentPreview>

      {/* Cursor Follow */}
      <ComponentPreview
        title="CursorFollow"
        description="A small element that follows your cursor inside a bounded area."
      >
        <div className="flex justify-center">
          <CursorFollow
            className="relative w-80 h-56 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden"
            renderFollower={(x, y) => (
              <motion.div
                className="absolute w-6 h-6 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50 pointer-events-none"
                animate={{ x: x - 12, y: y - 12 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
          >
            <span className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
              Move your cursor here
            </span>
          </CursorFollow>
        </div>
      </ComponentPreview>

      {/* Music Player - Liquid Glass */}
      <ComponentPreview
        title="Music Player"
        description="Liquid Glass music player with animated volume bars, progress seek, and play controls."
      >
        <div className="flex justify-center py-4">
          <MusicPlayer
            title="Midnight Dreams"
            artist="NeuraForge"
            duration={180}
          />
        </div>
      </ComponentPreview>

      {/* Video Player - Liquid Glass */}
      <ComponentPreview
        title="Video Player"
        description="Liquid Glass video player with poster preview and play/pause overlay."
      >
        <div className="flex justify-center py-4">
          <VideoPlayer
            title="NeuraForge UI Walkthrough"
            poster="https://placehold.co/640x360/1e1b4b/c4b5fd?text=NeuraForge+Demo"
          />
        </div>
      </ComponentPreview>

      {/* Mouse Effect Card */}
      <ComponentPreview
        title="Mouse Effect Card"
        description="Interactive dot pattern card that responds to cursor movement with repulsion physics and spring animations."
      >
        <div className="flex justify-center py-4">
          <MouseEffectCard
            title="NeuraForge"
            subtitle="200+ components for AI-powered interfaces. MCP-native, accessible, and MIT licensed."
            topText="AI-Native Library"
            topSubtext="Built for coding agents"
            primaryCtaText="Get Started"
            secondaryCtaText="View Components"
            footerText="MCP-Ready • WCAG 2.2 AA • MIT Licensed"
          />
        </div>
      </ComponentPreview>

      {/* Spotlight Cards */}
      <ComponentPreview
        title="Spotlight Cards"
        description="Feature grid with magnetic 3D tilt, aurora glow, shimmer sweep, and focus-dim siblings on hover."
      >
        <div className="w-full py-2">
          <SpotlightCards
            eyebrow="Why NeuraForge"
            heading="Built for the AI era"
            items={[
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>, title: "MCP Native", description: "AI agents query components directly — no hallucinated markup, every artifact verified.", color: "#a78bfa" },
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, title: "Accessible", description: "WCAG 2.2 AA compliant. Keyboard navigable, screen reader friendly, reduced-motion safe.", color: "#34d399" },
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>, title: "Performant", description: "Every component under 5kB tree-shaken. No runtime CSS-in-JS overhead.", color: "#f59e0b" },
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" /></svg>, title: "Integrity", description: "SHA-256 checksum verified. Same artifact every time, no supply chain risk.", color: "#60a5fa" },
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>, title: "TypeScript", description: "Strict typed props, exported interfaces, full IntelliSense support.", color: "#38bdf8" },
              { icon: <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" /></svg>, title: "Self-Hostable", description: "Docker compose up. No account, no license key, no internet required.", color: "#f472b6" },
            ]}
          />
        </div>
      </ComponentPreview>
    </div>
  );
}
