"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@neuraforge-ui/components/src/navigation-layout/index";
import Link from "next/link";

// Motion preset configurations matching @neuraforge-ui/motion presets
const presets = {
  "fade-in": {
    name: "Fade In",
    description: "Opacity 0→1 with configurable duration and delay",
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  "slide-up": {
    name: "Slide Up",
    description: "Slides element up from below with fade",
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  bounce: {
    name: "Bounce",
    description: "Spring entrance with overshoot",
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  "scale-in": {
    name: "Scale In",
    description: "Scales from 0.9 to 1 with fade",
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

type PresetKey = keyof typeof presets;

export default function MotionPage() {
  const [activePreset, setActivePreset] = useState<PresetKey>("fade-in");
  const [key, setKey] = useState(0);
  const [showList, setShowList] = useState(true);

  const replay = () => setKey((k) => k + 1);
  const preset = presets[activePreset];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-brand-700">
            ⚡ NeuraForge UI
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Components</Link>
            <span className="text-brand-700 font-medium">Motion</span>
            <Link href="/tokens" className="text-slate-600 hover:text-slate-900">Tokens</Link>
            <Link href="/mcp" className="text-slate-600 hover:text-slate-900">MCP</Link>
          </nav>
        </div>
      </header>

      <Container className="py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          🎬 Motion Presets
        </h1>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl">
          4 Framer Motion presets with full customization and reduced-motion support.
          All presets from <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">@neuraforge-ui/motion</code>.
        </p>

        {/* Preset Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Select Preset
            </h2>
            {(Object.keys(presets) as PresetKey[]).map((id) => (
              <button
                key={id}
                onClick={() => { setActivePreset(id); replay(); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  activePreset === id
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <span className="font-medium">{presets[id].name}</span>
                <p className="text-xs text-slate-500 mt-0.5">{presets[id].description}</p>
              </button>
            ))}

            <button
              onClick={replay}
              className="w-full mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              ↻ Replay Animation
            </button>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 min-h-[300px] flex items-center justify-center">
              <motion.div
                key={key}
                initial={preset.initial}
                animate={preset.animate}
                transition={preset.transition}
                className="w-64 h-40 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <p className="font-semibold text-slate-900">{preset.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{activePreset}</p>
                </div>
              </motion.div>
            </div>

            {/* Code Preview */}
            <div className="mt-6 rounded-xl bg-slate-900 p-6 text-sm font-mono text-slate-300 overflow-x-auto">
              <pre>{`import { motion } from "framer-motion";

<motion.div
  initial={${JSON.stringify(preset.initial)}}
  animate={${JSON.stringify(preset.animate)}}
  transition={${JSON.stringify(preset.transition)}}
>
  Your content
</motion.div>`}</pre>
            </div>
          </div>
        </div>

        {/* Animated List Demo */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Animated List</h2>
          <p className="text-slate-600 mb-6">
            Staggered entrance animation using AnimatePresence.
          </p>

          <button
            onClick={() => setShowList(!showList)}
            className="mb-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showList ? "Hide List" : "Show List"}
          </button>

          <AnimatePresence>
            {showList && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Components", "Tokens", "Motion", "MCP Core", "CLI", "Compositions"].map(
                  (item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="font-medium text-slate-900">@neuraforge-ui/{item.toLowerCase().replace(" ", "-")}</p>
                      <p className="text-xs text-slate-500 mt-1">v0.1.0 · Published</p>
                    </motion.div>
                  ),
                )}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Reduced Motion Notice */}
        <section className="mt-12 rounded-xl bg-amber-50 border border-amber-200 p-6">
          <h3 className="font-semibold text-amber-900 mb-2">♿ Reduced Motion Support</h3>
          <p className="text-sm text-amber-800">
            All @neuraforge-ui/motion presets automatically respect the user&apos;s{" "}
            <code className="bg-amber-100 px-1 rounded">prefers-reduced-motion</code> media query.
            When enabled, animations fall back to instant transitions with no movement.
          </p>
        </section>
      </Container>
    </div>
  );
}
