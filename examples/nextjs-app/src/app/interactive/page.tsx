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
        description="A 3D card flip interaction — click to reveal the back."
      >
        <div className="flex justify-center">
          <Flip
            front={
              <div className="w-64 h-40 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-medium">Click to flip</span>
              </div>
            }
            back={
              <div className="w-64 h-40 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
                <span className="text-white font-medium">This is the back!</span>
              </div>
            }
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
    </div>
  );
}
