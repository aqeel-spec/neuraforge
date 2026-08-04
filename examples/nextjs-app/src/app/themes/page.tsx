// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { themes } from "@neuraforge-ui/components/src/themes/index";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState(themes[0]?.name || "aurora");

  const selected = themes.find(t => t.name === activeTheme) || themes[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Themes</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          8 colorful theme presets inspired by modern design trends. Each includes full light + dark palettes with CSS custom properties.
        </p>
      </motion.div>

      {/* Theme Selector */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-3">
          {themes.map((theme) => {
            const primary = theme.colors.dark.primary?.split(" ") || ["250", "50%", "50%"];
            const hsl = `hsl(${primary.join(", ")})`;
            return (
              <button
                key={theme.name}
                onClick={() => setActiveTheme(theme.name)}
                className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  activeTheme === theme.name
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-md"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--muted))]"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shadow-inner"
                  style={{ backgroundColor: hsl }}
                />
                <span className="text-sm font-medium capitalize">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Theme Preview */}
      {selected && (
        <motion.div variants={fadeUp} className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            {/* Theme Header */}
            <div className="px-6 py-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <h2 className="text-xl font-bold capitalize">{selected.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{selected.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                <span>Radius: <code className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded">{selected.radius}</code></span>
                {selected.fontFamily && <span>Font: <code className="px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded">{selected.fontFamily}</code></span>}
              </div>
            </div>

            {/* Color Swatches - Light */}
            <div className="px-6 py-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Light Mode</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Object.entries(selected.colors.light).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <div
                      className="w-full h-12 rounded-lg border border-black/5 shadow-sm"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] truncate">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Swatches - Dark */}
            <div className="px-6 py-5 bg-[hsl(var(--muted))]/20 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Dark Mode</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Object.entries(selected.colors.dark).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <div
                      className="w-full h-12 rounded-lg border border-white/10 shadow-sm"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] truncate">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="px-6 py-6 border-t border-[hsl(var(--border))]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4">Preview</h3>
              <div
                className="rounded-xl p-6 border"
                style={{
                  backgroundColor: `hsl(${selected.colors.light.background})`,
                  borderColor: `hsl(${selected.colors.light.border})`,
                  borderRadius: selected.radius,
                }}
              >
                <h4 style={{ color: `hsl(${selected.colors.light.foreground})` }} className="text-lg font-semibold">Welcome back</h4>
                <p style={{ color: `hsl(${selected.colors.light["muted-foreground"]})` }} className="text-sm mt-1">Your dashboard is ready.</p>
                <div className="flex gap-3 mt-4">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{
                      backgroundColor: `hsl(${selected.colors.light.primary})`,
                      borderRadius: selected.radius,
                    }}
                  >
                    Get Started
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style={{
                      color: `hsl(${selected.colors.light.foreground})`,
                      borderColor: `hsl(${selected.colors.light.border})`,
                      backgroundColor: `hsl(${selected.colors.light.secondary})`,
                      borderRadius: selected.radius,
                    }}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
