/**
 * Example Next.js page demonstrating NeuraForge UI components.
 *
 * This shows:
 * - Component imports from @neuraforge/components
 * - Motion presets from @neuraforge/motion
 * - Accessible, keyboard-navigable, reduced-motion-safe UI
 */

import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          NeuraForge UI
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          A React + Tailwind component library that AI coding agents can query directly over MCP.
          No hallucinated markup. The same verified artifact every time.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="https://neuraforge.dev/docs"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Documentation
          </a>
          <a
            href="https://github.com/neuraforge/ui"
            className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why NeuraForge UI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Agent-First"
              description="AI agents call list_components, get_component, search_components over MCP. No copy-paste from docs."
            />
            <FeatureCard
              title="Checksum Verified"
              description="SHA-256 checksum verified before content is shown or written. No hallucinated markup."
            />
            <FeatureCard
              title="Self-Hostable"
              description="Run the full stack offline. No account, no key, no required internet connection."
            />
            <FeatureCard
              title="Accessible"
              description="WCAG 2.2 AA, keyboard navigable, reduced-motion safe. Every component, every time."
            />
            <FeatureCard
              title="Transactional CLI"
              description="Preview → confirm → apply → rollback. Never writes without your approval."
            />
            <FeatureCard
              title="MIT Licensed"
              description="Every artifact is public. No premium tier, no license keys, no entitlements."
            />
          </div>
        </div>
      </section>

      {/* Pricing Example */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Hosted MCP Service</h2>
          <p className="text-gray-600 mb-12">Optional managed capacity. Sells quota only — never artifacts.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingTier name="Starter" price={9} requests={500} />
            <PricingTier name="Pro" price={29} requests={3000} featured />
            <PricingTier name="Team" price={79} requests={10000} />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function PricingTier({ name, price, requests, featured }: { name: string; price: number; requests: number; featured?: boolean }) {
  return (
    <div className={`p-6 rounded-xl border-2 ${
      featured ? "border-blue-600 shadow-lg" : "border-gray-200"
    }`}>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-3xl font-bold mt-2">${price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
      <p className="text-gray-600 mt-2">{requests.toLocaleString()} requests/day</p>
      <button
        className={`mt-6 w-full py-2 rounded-lg font-medium ${
          featured
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
      >
        Get Started
      </button>
    </div>
  );
}
