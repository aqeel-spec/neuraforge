# NeuraForge UI — Phase 6: Production Hardening

> Based on comprehensive audit of 170 components + 14 packages + 2 services

## Audit Summary

| Metric | Value |
|--------|-------|
| Total components | 170 `.tsx` files |
| Total packages | 14 (all with tests) |
| Test files | 59 |
| Test-to-source ratio | ~1:5 |
| **Critical bugs found** | **152 issues** |

---

## 🔴 P0 — Ship Blockers (Must Fix)

### 1. Missing `'use client'` — 53 components BROKEN in Next.js
Components using React hooks without the directive will crash in App Router.

**Affected:**
- `forms/` — 19 files (autocomplete, calendar, color-picker, combobox, date-picker, file-upload, multi-select, otp-input, phone-input, range-slider, search-input, select, signature-pad, slider, star-rating, switch, tag-input, text-field, textarea)
- `navigation-layout/` — 23 files (accordion, back-to-top, carousel, collapsible, command-palette, context-menu, dock, drawer, dropdown-menu, infinite-scroll, masonry, mega-menu, menubar, navbar, navigation-menu, pagination, parallax-section, resizable, split-pane, sticky, tabs, tree-view, virtual-list)
- `feedback/` — 8 files (confetti, confirm-dialog, dialog, hover-card, notification-center, popover, sheet, spotlight)
- `marketing/` — 3 files (announcement-bar, hero-with-video, newsletter)

**Fix:** Automated codemod to prepend `'use client';`

### 2. Missing Dark Mode — 81 components (48%)
**All 23 `forms/` components have ZERO dark mode support.**

**Fix:** Systematic `dark:` variant addition, forms first.

### 3. Infinite Animations Without Reduced-Motion Guard — 18 components
Accessibility violation. Users with vestibular disorders will experience discomfort.

**Affected:** ai-loader (4 loops), agent-avatar (3), siri-orb (3), agentic-globe, morph-surface, ecommerce-multi-agent, sub-agent-starter, ai-reasoning, ai-bubble-chat, ai-context-meter, ai-message, ai-response, ai-tool-call, beams-background, cta-orbiting, hero-animated, page-404, testimonial-marquee, mouse-effect-card, notification-badge

**Fix:** Add `useReducedMotion()` hook or `motion-reduce:` classes.

### 4. Missing Essential Components
- ❌ **Button** — The library has NO Button component
- ❌ **Tooltip** — Table stakes for any UI library
- ❌ **Avatar** (base) — only AvatarGroup exists
- ❌ **Modal/Overlay** primitive

### 5. Monolithic Files Needing Split
| File | Lines | Action |
|------|-------|--------|
| `drawer-variants.tsx` | 406 | Split into 10 individual files |
| `data-display.tsx` (root) | 397 | Move into `data-display/` dir |

### 6. Responsiveness Breakers
- `comparison-table.tsx`: `min-w-[600px]` forces horizontal scroll
- `flip.tsx`: `max-w-[300px]`, `h-[340px]` hardcoded
- `testimonial-marquee.tsx`: `min-w-[320px] max-w-[380px]`
- `team-carousel.tsx`: `min-w-[260px]`
- `drawer-variants.tsx`: `w-[400px]`

---

## 🟡 P1 — Critical Quality (Week 1)

### 7. Infrastructure Gaps
| Item | Status | Priority |
|------|--------|----------|
| Storybook | ❌ Missing | P1 |
| Bundle size monitoring (size-limit) | ❌ Missing | P1 |
| Dependabot/Renovate | ❌ Missing | P1 |
| E2E tests (Playwright) | ❌ Missing | P1 |
| Docs deployment workflow | ❌ Missing | P1 |
| Turborepo (task caching) | ❌ Missing | P1 |

### 8. Stub Components Need Real Implementations
| Component | Lines | Issue |
|-----------|-------|-------|
| `aspect-ratio.tsx` | 19 | Trivial wrapper |
| `scroll-area.tsx` | 26 | Minimal |
| `separator.tsx` | 26 | Minimal |

---

## 🟢 P2 — Missing Premium Components (Week 2-3)

### Essential Primitives
- Button (with 8 variants: default, secondary, outline, ghost, link, destructive, icon, loading)
- Tooltip (4 positions, delay, arrow)
- Avatar (base, with image/initials/icon fallback)
- Overlay/Portal manager

### Data & Content
- Metric/KPI Card (with trend arrows)
- File Tree (specialized tree view)
- JSON Viewer (collapsible, syntax highlighted)
- Diff Viewer (side-by-side + unified)
- Data Grid (virtualized, sortable, filterable)
- Rich Text / Markdown Editor

### Navigation & Layout
- Stepper/Wizard (multi-step form container)
- FAB (Floating Action Button)
- App Shell (complete layout frame)
- Scroll Spy

### Feedback & Overlays
- Snackbar (stacking notifications)
- Enhanced Command Menu (⌘K with groups, recents)

### E-commerce & SaaS Blocks
- Checkout Form
- Product Gallery (with zoom)
- Usage Meter
- Invoice Template
- Plan Comparison Card

---

## 🔵 P3 — Documentation & Testing (Month 2)

### 9. Documentation Gaps
- ❌ MCP operations reference
- ❌ CLI usage guide
- ❌ Design tokens reference
- ❌ Per-component API docs (props tables)
- ❌ Getting-started tutorial
- ❌ Compositions guide

### 10. Testing Gaps
- Only 3/14 packages have property tests
- No E2E tests
- No visual regression tests
- Form components lack edge-case tests

### 11. Missing Example Pages
- `/compositions` — composition system demo
- `/three-d` — 3D components demo
- `/self-hosting` — self-hosting guide

---

## Execution Order

### Sprint 1 (P0 — Ship Blockers)
1. ✅ Automated `'use client'` codemod (53 files)
2. ✅ Add reduced-motion guards (18 files)
3. ✅ Create Button component (8 variants)
4. ✅ Create Tooltip component
5. ✅ Create Avatar base component
6. ✅ Split drawer-variants.tsx
7. ✅ Fix responsive breakers

### Sprint 2 (P1 — Quality + Infra)
8. Add dark mode to forms/ (23 components)
9. Add Storybook
10. Add size-limit to CI
11. Add Dependabot config
12. Add Playwright E2E tests

### Sprint 3 (P2 — Premium Components)
13. Build 15 missing premium components
14. Add e-commerce block kit

### Sprint 4 (P3 — Docs & Polish)
15. Complete documentation site
16. Add property tests to all packages
17. Visual regression setup

---

## Success Criteria

- [ ] Zero components missing `'use client'`
- [ ] 100% dark mode coverage
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Button, Tooltip, Avatar exist
- [ ] No file over 300 lines
- [ ] All components responsive at 320px
- [ ] Storybook running with all components
- [ ] Bundle size tracked in CI
- [ ] E2E tests passing
- [ ] Full docs site deployed
