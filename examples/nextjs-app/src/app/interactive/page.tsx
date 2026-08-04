// @ts-nocheck
"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const components = [
  { name: "Cursor Follow", description: "Elements that track and respond to cursor movement" },
  { name: "Dynamic Island", description: "Adaptive floating UI container inspired by iOS Dynamic Island" },
  { name: "Power Off Slide", description: "Slide-to-confirm interaction for destructive actions" },
  { name: "Expandable Cards", description: "Cards that expand to reveal detailed content on interaction" },
  { name: "Image Zoom", description: "Smooth pinch-to-zoom and click-to-zoom image viewer" },
  { name: "Flip", description: "3D card flip animation revealing front and back content" },
  { name: "Photo Stack", description: "Draggable photo stack with swipe-to-dismiss gestures" },
  { name: "Phototab", description: "Tabbed photo gallery with smooth crossfade transitions" },
  { name: "Interactive Image Selector", description: "Click or drag to select regions within an image" },
];

export default function InteractivePage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold">Interactive</h1>
        <p className="text-muted-foreground mt-2">
          Gesture-driven, pointer-aware, and touch-friendly interactive components.
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
