---
title: Motion Presets
description: Framer Motion animation presets with accessibility support
---

# Motion Presets

Pre-built Framer Motion animations with full customization schemas and reduced-motion support.

## Available Presets

| Preset   | Description           | Duration |
| -------- | --------------------- | -------- |
| fade-in  | Opacity 0→1           | 0.3s     |
| slide-up | Slide up 20px + fade  | 0.4s     |
| bounce   | Spring scale entrance | 0.5s     |
| scale-in | Scale 0.8→1 + fade    | 0.25s    |

## Usage

```tsx
import { AnimatedContainer } from "@neuraforge/motion";
import { FADE_IN_SCHEMA } from "@neuraforge/motion";

<AnimatedContainer schema={FADE_IN_SCHEMA}>
  <div>Content fades in</div>
</AnimatedContainer>;
```

## Customization

Every preset exposes typed controls:

```tsx
<AnimatedContainer
  schema={BOUNCE_SCHEMA}
  config={{ overrides: { springStiffness: 400, springDamping: 30 } }}
>
  <div>Snappy bounce</div>
</AnimatedContainer>
```

## Reduced Motion

All presets automatically respect `prefers-reduced-motion`:

- Decorative animations are disabled
- Essential state transitions use capped durations
- Content, focus order, and actions are always preserved
