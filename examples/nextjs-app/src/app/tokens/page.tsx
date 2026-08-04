"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@neuraforge-ui/components/src/navigation-layout/index";

// Token definitions matching @neuraforge-ui/tokens
const colorTokens = {
  brand: {
    50: "#f0f4ff",
    100: "#dbe4ff",
    200: "#bac8ff",
    300: "#91a7ff",
    400: "#748ffc",
    500: "#5c7cfa",
    600: "#4c6ef5",
    700: "#4263eb",
    800: "#3b5bdb",
    900: "#364fc7",
  },
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: { 500: "#22c55e", 600: "#16a34a" },
  warning: { 500: "#eab308", 600: "#ca8a04" },
  error: { 500: "#ef4444", 600: "#dc2626" },
};

const spacingTokens = [
  { name: "xs", value: "0.25rem", px: "4px" },
  { name: "sm", value: "0.5rem", px: "8px" },
  { name: "md", value: "1rem", px: "16px" },
  { name: "lg", value: "1.5rem", px: "24px" },
  { name: "xl", value: "2rem", px: "32px" },
  { name: "2xl", value: "3rem", px: "48px" },
  { name: "3xl", value: "4rem", px: "64px" },
];

const radiusTokens = [
  { name: "none", value: "0" },
  { name: "sm", value: "0.25rem" },
  { name: "md", value: "0.375rem" },
  { name: "lg", value: "0.5rem" },
  { name: "xl", value: "0.75rem" },
  { name: "2xl", value: "1rem" },
  { name: "full", value: "9999px" },
];

const typographyTokens = [
  { name: "xs", size: "0.75rem", weight: "400", sample: "Extra small text" },
  { name: "sm", size: "0.875rem", weight: "400", sample: "Small body text" },
  { name: "base", size: "1rem", weight: "400", sample: "Base body text" },
  { name: "lg", size: "1.125rem", weight: "500", sample: "Large text" },
  { name: "xl", size: "1.25rem", weight: "600", sample: "Heading text" },
  { name: "2xl", size: "1.5rem", weight: "700", sample: "Section heading" },
  { name: "3xl", size: "1.875rem", weight: "700", sample: "Page title" },
  { name: "4xl", size: "2.25rem", weight: "800", sample: "Hero headline" },
];

export default function TokensPage() {
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
            <Link href="/motion" className="text-slate-600 hover:text-slate-900">Motion</Link>
            <span className="text-brand-700 font-medium">Tokens</span>
            <Link href="/mcp" className="text-slate-600 hover:text-slate-900">MCP</Link>
          </nav>
        </div>
      </header>

      <Container className="py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">🎨 Design Tokens</h1>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl">
          The token system from <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">@neuraforge-ui/tokens</code>{" "}
          provides colors, spacing, typography, and radius values that generate a Tailwind theme.
        </p>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Colors</h2>

          {Object.entries(colorTokens).map(([name, shades]) => (
            <div key={name} className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {name}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(shades).map(([shade, hex]) => (
                  <div key={shade} className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-slate-200"
                      style={{ backgroundColor: hex }}
                    />
                    <p className="text-xs font-medium text-slate-700 mt-1">{shade}</p>
                    <p className="text-xs text-slate-400">{hex}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Spacing</h2>
          <div className="space-y-3">
            {spacingTokens.map(({ name, value, px }) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium text-slate-700">{name}</span>
                <div
                  className="h-6 bg-brand-500 rounded"
                  style={{ width: value }}
                />
                <span className="text-xs text-slate-500">
                  {value} ({px})
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Border Radius</h2>
          <div className="flex gap-4 flex-wrap">
            {radiusTokens.map(({ name, value }) => (
              <div key={name} className="text-center">
                <div
                  className="w-20 h-20 bg-brand-100 border-2 border-brand-400"
                  style={{ borderRadius: value }}
                />
                <p className="text-xs font-medium text-slate-700 mt-2">{name}</p>
                <p className="text-xs text-slate-400">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Typography</h2>
          <div className="space-y-4">
            {typographyTokens.map(({ name, size, weight, sample }) => (
              <div key={name} className="flex items-baseline gap-4 border-b border-slate-100 pb-3">
                <span className="w-12 text-xs font-medium text-slate-500">{name}</span>
                <span style={{ fontSize: size, fontWeight: Number(weight) }}>
                  {sample}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {size} / {weight}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tailwind Theme Generation */}
        <section className="rounded-xl bg-slate-900 p-6 text-sm font-mono text-slate-300">
          <h3 className="text-white font-semibold mb-4 font-sans">
            Generated Tailwind Theme (via @neuraforge-ui/tokens)
          </h3>
          <pre className="overflow-x-auto">{`import { generateTailwindTheme } from "@neuraforge-ui/tokens";

const theme = generateTailwindTheme({
  brand: { hue: 230, saturation: 85, lightness: 55 },
  radius: "md",
  spacing: "comfortable",
});

// tailwind.config.js
module.exports = {
  theme: { extend: theme },
};`}</pre>
        </section>
      </Container>
    </div>
  );
}
