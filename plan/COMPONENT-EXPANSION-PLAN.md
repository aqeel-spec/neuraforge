# NeuraForge UI Component Expansion Plan

## Goal: Expand from 20 → 100 production-ready components

All components will be WCAG 2.2 AA, keyboard navigable, reduced-motion safe, and MCP-queryable.

---

## Current: 20 Components (v1.0)

| Category         | Components                             |
| ---------------- | -------------------------------------- |
| Navigation (4)   | Navbar, Sidebar, Breadcrumbs, Tabs     |
| Layout (5)       | Container, Grid, Card, Hero, Footer    |
| Forms (2)        | TextField, Form                        |
| Feedback (4)     | Dialog, Alert, Toast, LoadingIndicator |
| Data Display (3) | DataTable, Stat, Badge                 |
| Marketing (2)    | Pricing, Testimonial                   |

---

## Phase 2: +30 Components → 50 total (v1.1)

### Navigation (+4 = 8 total)

| Component      | Description                             | Real-world Use             |
| -------------- | --------------------------------------- | -------------------------- |
| CommandPalette | Cmd+K searchable command menu           | Notion, Linear, Vercel     |
| MegaMenu       | Multi-column dropdown navigation        | Stripe, AWS, Shopify       |
| Pagination     | Page navigation with prev/next/numbered | Any listing page           |
| StepIndicator  | Multi-step progress indicator           | Checkout flows, onboarding |

### Layout (+6 = 11 total)

| Component   | Description                               | Real-world Use           |
| ----------- | ----------------------------------------- | ------------------------ |
| Accordion   | Expandable/collapsible content sections   | FAQ pages, settings      |
| Divider     | Horizontal/vertical section separator     | Content separation       |
| AspectRatio | Responsive aspect ratio container         | Video/image embeds       |
| Stack       | Vertical/horizontal flex layout primitive | Spacing utility          |
| Drawer      | Slide-in panel (left/right/bottom)        | Mobile nav, filters      |
| SplitPane   | Resizable split layout                    | Code editors, dashboards |

### Forms (+8 = 10 total)

| Component     | Description                    | Real-world Use         |
| ------------- | ------------------------------ | ---------------------- |
| Select        | Accessible dropdown select     | Any form               |
| Checkbox      | Single checkbox with label     | Toggles, agreements    |
| CheckboxGroup | Multiple selection checkboxes  | Filter panels          |
| RadioGroup    | Single selection radio buttons | Plan selection         |
| Switch        | Toggle switch on/off           | Settings, preferences  |
| Textarea      | Multi-line text input          | Comments, descriptions |
| DatePicker    | Calendar date selection        | Booking, scheduling    |
| FileUpload    | Drag-and-drop file upload zone | Attachments, media     |

### Feedback (+4 = 8 total)

| Component     | Description                     | Real-world Use            |
| ------------- | ------------------------------- | ------------------------- |
| Progress      | Linear/circular progress bar    | Uploads, processing       |
| Skeleton      | Content loading placeholder     | Perceived performance     |
| EmptyState    | No-data placeholder with action | Empty lists, new accounts |
| ConfirmDialog | Yes/No confirmation modal       | Destructive actions       |

### Data Display (+6 = 9 total)

| Component   | Description                    | Real-world Use             |
| ----------- | ------------------------------ | -------------------------- |
| Avatar      | User photo/initials circle     | Profiles, comments         |
| AvatarGroup | Stacked avatar collection      | Team members, assignees    |
| Tag         | Removable/filterable tag chips | Categories, filters        |
| Timeline    | Vertical event timeline        | Activity feeds, changelogs |
| Tooltip     | Hover/focus information popup  | Help text, abbreviations   |
| KBD         | Keyboard shortcut display      | Hotkey documentation       |

### Marketing (+2 = 4 total)

| Component   | Description                     | Real-world Use           |
| ----------- | ------------------------------- | ------------------------ |
| FeatureGrid | Icon + title + description grid | Feature/benefit sections |
| CTA         | Call-to-action banner section   | Conversion sections      |

---

## Phase 3: +30 Components → 80 total (v1.2)

### Navigation (+4 = 12 total)

| Component        | Description                  | Real-world Use         |
| ---------------- | ---------------------------- | ---------------------- |
| BottomNav        | Mobile bottom navigation bar | Mobile apps            |
| TableOfContents  | Auto-generated page outline  | Documentation, blogs   |
| SegmentedControl | Inline toggle between views  | List/grid toggle, tabs |
| BackToTop        | Scroll-to-top button         | Long pages             |

### Layout (+5 = 16 total)

| Component | Description                     | Real-world Use               |
| --------- | ------------------------------- | ---------------------------- |
| Masonry   | Pinterest-style staggered grid  | Image galleries, cards       |
| Carousel  | Swipeable content slider        | Testimonials, product images |
| Popover   | Anchored floating content panel | Rich tooltips, mini-forms    |
| Sheet     | Bottom sheet (mobile pattern)   | Mobile actions, filters      |
| Sticky    | Sticky-positioned container     | Sticky headers, sidebars     |

### Forms (+6 = 16 total)

| Component    | Description                       | Real-world Use       |
| ------------ | --------------------------------- | -------------------- |
| Autocomplete | Searchable input with suggestions | Address, tag input   |
| Slider       | Range slider input                | Price filter, volume |
| RangeSlider  | Dual-handle range selection       | Min/max price filter |
| ColorPicker  | Color selection with presets      | Theme customization  |
| OTPInput     | One-time password digit boxes     | Verification codes   |
| PhoneInput   | International phone number input  | Contact forms        |

### Feedback (+3 = 11 total)

| Component          | Description                          | Real-world Use          |
| ------------------ | ------------------------------------ | ----------------------- |
| Banner             | Dismissible top-of-page notice       | Announcements, warnings |
| NotificationCenter | Notification dropdown panel          | App notifications       |
| InlineAlert        | Contextual inline validation message | Form field errors       |

### Data Display (+7 = 16 total)

| Component        | Description                        | Real-world Use           |
| ---------------- | ---------------------------------- | ------------------------ |
| Calendar         | Month/week/day calendar view       | Scheduling, availability |
| Chart            | Line/bar/pie chart wrapper         | Dashboards, analytics    |
| CodeBlock        | Syntax-highlighted code display    | Documentation, demos     |
| CopyButton       | Click-to-copy with feedback        | Code snippets, URLs      |
| CountUp          | Animated number counter            | Stats, metrics           |
| List             | Structured list with icons/actions | Settings, menus          |
| Accordion (Data) | Data-focused expandable rows       | FAQ, nested information  |

### Marketing (+5 = 9 total)

| Component       | Description               | Real-world Use  |
| --------------- | ------------------------- | --------------- |
| FAQ             | Question/answer accordion | Support pages   |
| LogoCloud       | Partner/client logo grid  | Trust signals   |
| Newsletter      | Email signup section      | Lead generation |
| SocialProof     | User count/rating display | Conversion      |
| ComparisonTable | Feature comparison matrix | Plan comparison |

---

## Phase 4: +20 Components → 100 total (v1.3)

### Navigation (+2 = 14 total)

| Component   | Description              | Real-world Use     |
| ----------- | ------------------------ | ------------------ |
| Dock        | macOS-style icon dock    | Desktop apps       |
| ContextMenu | Right-click context menu | Power user actions |

### Layout (+4 = 20 total)

| Component       | Description                     | Real-world Use             |
| --------------- | ------------------------------- | -------------------------- |
| Bento           | Bento grid layout (mixed sizes) | Modern landing pages       |
| Marquee         | Infinite scrolling ticker       | Logo clouds, announcements |
| ParallaxSection | Scroll-triggered parallax       | Visual storytelling        |
| ResizablePanel  | Drag-to-resize panels           | IDE-style layouts          |

### Forms (+4 = 20 total)

| Component    | Description                   | Real-world Use       |
| ------------ | ----------------------------- | -------------------- |
| SearchInput  | Dedicated search with filters | Search bars          |
| TagInput     | Multi-value tag entry         | Labels, categories   |
| StarRating   | Star-based rating input       | Reviews, feedback    |
| SignaturePad | Draw-to-sign signature area   | Documents, approvals |

### Feedback (+2 = 13 total)

| Component | Description                        | Real-world Use   |
| --------- | ---------------------------------- | ---------------- |
| Spotlight | Focus overlay highlighting element | Onboarding tours |
| Confetti  | Celebration animation overlay      | Success moments  |

### Data Display (+4 = 20 total)

| Component      | Description                     | Real-world Use             |
| -------------- | ------------------------------- | -------------------------- |
| TreeView       | Hierarchical collapsible tree   | File explorers, org charts |
| Kanban         | Drag-and-drop kanban board      | Project management         |
| InfiniteScroll | Auto-loading scrollable list    | Social feeds, catalogs     |
| VirtualList    | Virtualized long list rendering | Large datasets             |

### Marketing (+4 = 13 total)

| Component       | Description                        | Real-world Use       |
| --------------- | ---------------------------------- | -------------------- |
| HeroWithVideo   | Hero section with background video | Landing pages        |
| TeamGrid        | Team member photo grid             | About pages          |
| StatsSection    | Animated metrics row               | Trust/impact numbers |
| AnnouncementBar | Top-of-page promo bar              | Sales, launches      |

---

## Final Component Count: 100

| Category     | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total   |
| ------------ | ------- | ------- | ------- | ------- | ------- |
| Navigation   | 4       | 8       | 12      | 14      | **14**  |
| Layout       | 5       | 11      | 16      | 20      | **20**  |
| Forms        | 2       | 10      | 16      | 20      | **20**  |
| Feedback     | 4       | 8       | 11      | 13      | **13**  |
| Data Display | 3       | 9       | 16      | 20      | **20**  |
| Marketing    | 2       | 4       | 9       | 13      | **13**  |
| **Total**    | **20**  | **50**  | **80**  | **100** | **100** |

---

## Implementation Standards (All Phases)

Every component MUST:

1. **Accessibility**: WCAG 2.2 AA compliant
2. **Keyboard**: Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
3. **Reduced Motion**: Respect `prefers-reduced-motion`
4. **Focus Visible**: Clear focus indicators using shared ring pattern
5. **Semantic HTML**: Proper ARIA roles, labels, and live regions
6. **TypeScript**: Strict typed props with exported interface
7. **Tailwind Only**: No CSS-in-JS or proprietary runtime
8. **Responsive**: Mobile-first, works at all breakpoints
9. **Dark Mode Ready**: Uses CSS variables / Tailwind dark: variant
10. **SSR Safe**: No window/document access on initial render
11. **Checksum**: SHA-256 verified source in Registry
12. **MCP Queryable**: Full metadata in catalog for AI agent discovery
13. **Documented**: Props table, examples, behavior map, keyboard shortcuts
14. **Tested**: Unit test + accessibility test per component
15. **Performance Budget**: Bundle size < 5kB per component (tree-shaken)

---

## Priority Order

Based on real-world website usage frequency:

### Must-have for any website (Phase 2 priority)

1. Select, Checkbox, RadioGroup, Switch — every form needs these
2. Avatar, Tooltip, Progress — universal UI patterns
3. Pagination, CommandPalette — navigation essentials
4. Skeleton, EmptyState — loading/empty states
5. Accordion, Drawer — content organization

### High-value for SaaS/dashboards (Phase 3 priority)

1. Calendar, Chart, CodeBlock — data-heavy apps
2. Autocomplete, DatePicker, Slider — complex inputs
3. Banner, NotificationCenter — communication
4. Carousel, Popover — rich interactions

### Differentiators (Phase 4 priority)

1. Kanban, TreeView, VirtualList — advanced patterns
2. Bento, Marquee, ParallaxSection — modern aesthetics
3. Spotlight, Confetti — delight moments
4. SignaturePad, StarRating — specialized inputs

---

## Release Timeline (Suggested)

| Phase   | Target   | Components | Milestone                          |
| ------- | -------- | ---------- | ---------------------------------- |
| Phase 1 | ✅ Done  | 20         | MVP                                |
| Phase 2 | +4 weeks | 50         | Production-ready for most websites |
| Phase 3 | +4 weeks | 80         | Full SaaS/dashboard coverage       |
| Phase 4 | +3 weeks | 100        | Complete library                   |

---

## MCP Impact

At 100 components, the MCP server becomes significantly more powerful:

```
Agent: "I need a checkout flow"
MCP:   → search_components("checkout")
       ← StepIndicator + Form + Select + RadioGroup + CTA
       (5 verified components, exact source, one install command)
```

```
Agent: "Add a notification system"
MCP:   → search_components("notifications")
       ← NotificationCenter + Toast + Badge + Banner
       (4 verified components with keyboard/screen-reader support)
```

```
Agent: "Build a pricing page"
MCP:   → search_compositions("pricing page")
       ← Pricing + ComparisonTable + FAQ + CTA + Testimonial
       (Full page section from curated composition)
```
