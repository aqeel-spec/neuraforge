// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import { AgentAvatar } from "@neuraforge-ui/components/src/agent-visual/agent-avatar";
import { SiriOrb } from "@neuraforge-ui/components/src/agent-visual/siri-orb";
import { MorphSurface } from "@neuraforge-ui/components/src/agent-visual/morph-surface";
import { BrandingAgent } from "@neuraforge-ui/components/src/agent-visual/branding-agent";
import { SubAgentStarter } from "@neuraforge-ui/components/src/agent-visual/sub-agent-starter";

export default function AgentVisualPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Agent Visual Components
        </h1>
        <p className="text-gray-400 text-lg">
          Live demos of AI agent visual identity components
        </p>
      </motion.header>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* AgentAvatar — 4 statuses */}
        <ComponentPreview
          title="AgentAvatar"
          description="Animated avatar with status indicators. Supports idle, thinking, speaking, and error states."
        >
          <div className="flex items-end gap-8 flex-wrap justify-center">
            <div className="flex flex-col items-center gap-2">
              <AgentAvatar size="sm" status="idle" />
              <span className="text-xs text-gray-400">Idle (sm)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentAvatar size="md" status="thinking" />
              <span className="text-xs text-gray-400">Thinking (md)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentAvatar size="lg" status="speaking" />
              <span className="text-xs text-gray-400">Speaking (lg)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentAvatar size="xl" status="error" />
              <span className="text-xs text-gray-400">Error (xl)</span>
            </div>
          </div>
        </ComponentPreview>

        {/* SiriOrb — active vs idle */}
        <ComponentPreview
          title="SiriOrb"
          description="Fluid gradient orb inspired by Siri. Responds to active/idle state with smooth transitions."
        >
          <div className="flex items-center gap-12 justify-center">
            <div className="flex flex-col items-center gap-3">
              <SiriOrb active />
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <SiriOrb active={false} />
              <span className="text-xs text-gray-400">Idle</span>
            </div>
          </div>
        </ComponentPreview>

        {/* MorphSurface — default blob */}
        <ComponentPreview
          title="MorphSurface"
          description="Organic morphing surface with customizable gradient colors. Uses SVG filter turbulence for fluid motion."
        >
          <div className="flex justify-center">
            <MorphSurface />
          </div>
        </ComponentPreview>

        {/* BrandingAgent — agent card */}
        <ComponentPreview
          title="BrandingAgent"
          description="Agent identity card displaying name, role, and capabilities with branded styling."
        >
          <div className="flex justify-center">
            <BrandingAgent
              name="NeuraForge Agent"
              role="UI Component Specialist"
              capabilities={["React", "Tailwind", "Accessibility"]}
            />
          </div>
        </ComponentPreview>

        {/* SubAgentStarter — startup animation */}
        <ComponentPreview
          title="SubAgentStarter"
          description="Startup sequence animation for spawning sub-agents. Shows initialization progress."
        >
          <div className="flex justify-center">
            <SubAgentStarter agentName="CodeReviewer" />
          </div>
        </ComponentPreview>
      </div>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>
          NeuraForge UI — Agent Visual Components •{" "}
          <span className="text-gray-400">5 of 7 components shown</span>
        </p>
        <p className="mt-1 text-gray-600">
          AgenticGlobe and EcommerceMultiAgent omitted (require complex 3D setup)
        </p>
      </footer>
    </div>
  );
}
