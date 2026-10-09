# AgentNine Design Rules v2

> **Implementation note, September 28, 2026:** This is the design intent and quality contract, not a faithful transcription of the current CSS. The current code uses a red accent (`#DD0200` in light mode and `#FF7772` for dark-theme accent text), not blue. Geist and Geist Mono are used for UI/data, Georgia/Times for standard `h1`/`h2`, and the homepage hero has separate Didot/Bodoni/Times plus a locally bundled mono label font. See [`../product/PROJECT_REFERENCE.md`](../product/PROJECT_REFERENCE.md) for exact implementation tokens, typography, calculated contrast checks, and known differences. Where this file describes an intended direction and the reference records actual code, treat the reference as current implementation truth.

This file is the consolidated design brief for AgentNine. It records the
current product direction and adds the verified guidance
from the installed and referenced design skills below.

This is a design and quality contract, not a license to replace working
routes, data, or components. Preserve existing behavior unless a change is
explicitly requested and wired.

---

## 1. Source skills and how they are used

### tasteskill v2 (experimental)

The current AgentNine implementation and `README.md` are the product-specific
source of truth. They define the editorial marketplace direction, trust model,
semantic theme tokens, component responsibilities, routes, responsive rules,
and the requirement not to claim capabilities that are not wired.

Use it to answer: **What should AgentNine feel like and what behavior must it
preserve?**

### Design Skills — designskills.dev

Design Skills is a catalog of reusable skills for AI coding agents. The site
currently presents 230 skills across visual styles, landing pages, motion and
scroll, 3D/WebGL, product surfaces, layout and grids, brand and identity,
images and assets, design systems, accessibility and quality, CSS craft, UX and
research, and workflow.

Use the catalog as a source of carefully chosen references, not as a reason to
combine unrelated visual treatments. For AgentNine, prefer editorial,
minimalist, clean, accessibility, responsive, design-system, and CSS-craft
skills. Select a style deliberately and record why it supports the product.
Do not import a catalog style that conflicts with the trust-first rules below.

### Hallmark — `nutlope/hallmark`

Repository: <https://github.com/nutlope/hallmark>

Hallmark is an anti-AI-slop design skill for new pages, audits, redesigns, and
design studies. Its important additions are:

- choose a page macrostructure before styling details;
- vary structure between pages instead of making color-swapped templates;
- use honest copy and never invent metrics, testimonials, logos, or proof;
- select and lock design tokens before rendering;
- do not redraw browser, phone, IDE, or fake code-window chrome;
- verify mobile output at 320px, 375px, 414px, and 768px;
- perform a pre-emit critique across philosophy, hierarchy, execution,
  specificity, restraint, and variety;
- use `audit` for findings without edits, `redesign` for an in-place visual
  redesign, and `study` to extract design DNA without pixel-copying;
- preserve the existing implementation boundaries unless a full rebuild is
  explicitly approved.

Hallmark's named themes and macrostructures are a source of variety, not a
requirement to add decorative themes to AgentNine. The AgentNine default
remains editorial and trust-oriented.

### antislop — `miqdadbadjuber/anti-slop`

Repository: <https://github.com/miqdadbadjuber/anti-slop>

Antislop is a filter, not a style guide. It does not prescribe colors, fonts,
or layouts; this design-rules document supplies that direction. Its core model adds:

- 38 mandatory rules in hard-gate, purpose-gate, and quality-lock tiers;
- a liveliness toolkit using ENERGY, RHYTHM, and MOTION;
- a mandatory delivery gate before shipping;
- additive concern-specific skills rather than loading every rule for every
  task.

The installed concern-specific skills are:

| Skill | Apply when |
|---|---|
| `antislop` | Every design or copy task; core filter and delivery gate |
| `antislop-ui` | Layout, color, components, decoration, motion, and structure |
| `antislop-copywriting` | Headlines, body copy, CTAs, labels, and markdown |
| `antislop-human` | Contrast, keyboard access, focus, states, and usability |
| `antislop-layoutmobile` | Responsive reflow, grids, breakpoints, overflow, and tap targets |
| `antislop-code` | Removing low-value AI-generated comments without changing behavior |

Use only the relevant additive skills for a task. Do not treat the filter as a
replacement for the AgentNine product brief.

---

## 2. Product design direction

AgentNine is a curated directory and marketplace for open-source AI agents.
The visual direction is a restrained, editorial, premium SaaS marketplace:

- practical information instead of hype;
- source-linked listings rather than anonymous recommendations;
- visible setup, access, freshness, and verification context;
- strong typography and controlled spacing;
- real content as the visual material;
- useful information density and quiet confidence;
- limited, functional motion.

Trust comes before spectacle. Verification, source, version, freshness, and
access details matter more than decorative effects.

Do not present AgentNine as an app store, safety-certification authority,
social network, automated installer, live crawler, or trending engine. Limited
email/password account entry exists, but do not imply saved lists, publishing,
personalization, or other account workflows until they are implemented.

---

## 3. Anti-slop and anti-pattern rules

### Never invent

- metrics, percentages, performance claims, or customer counts;
- testimonials, customer logos, ratings, or case studies;
- “live”, “trending”, “trusted”, “verified”, or “safe” claims without data;
- setup success when a write or validation did not complete;
- backend capabilities that are not wired.

“Verified” means that recorded checklist evidence exists. It does not mean
that the software is universally safe. A published listing may have a zero
verification score.

### Avoid generic visual patterns

- faux browser-window, phone, terminal, or IDE mockups;
- decorative orbit rings, floating cards, or unexplained nodes;
- excessive gradients, universal glassmorphism, and purple AI gradients;
- generic dashboard cards on the public homepage;
- repeated identical three-column feature grids;
- unexplained badges and competing primary buttons;
- tiny low-contrast labels;
- decoration that exists only to make an empty area look busy.

Any visual technique must have a clear product, navigation, comprehension, or
feedback purpose. If it does not, remove it.

### Preserve specificity

Every page should have a deliberate structure and a reason for its hierarchy.
Do not make every route follow the same hero → features → CTA → footer recipe.
Vary section rhythm when the content supports it, while keeping navigation and
the information architecture stable.

---

## 4. Layout and responsive behavior

Use one consistent content rail:

```css
.container {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
}
```

Below 800px, use approximately 16px horizontal gutters. The primary
breakpoint is 800px:

- collapse navigation and reveal the mobile menu;
- hide the desktop CTA;
- make hero, browse, feature, and card layouts one column;
- stack footer, admin forms, and CTA panels;
- use a two-column category list where appropriate;
- prevent horizontal overflow.

Before shipping, inspect at 320px, 375px, 414px, 768px, 1024px, and 1440px.
There must be no accidental horizontal scrolling. Use intentional overflow
wrappers for tables and admin surfaces.

Clickable text must not wrap into an unusable two-line control. Image-bearing
grid tracks should use `minmax(0, 1fr)`, and long display text must be allowed
to wrap safely.

---

## 5. Theme, tokens, and typography

Light and dark mode are separate visual systems. Use semantic variables for
all shared surfaces:

- `--ink` for primary text;
- `--muted` for supporting text;
- `--line` for borders and separators;
- `--paper` for the page background;
- `--panel` and `--surface` for grouped surfaces;
- `--field` for inputs and selects;
- `--accent-soft` for quiet highlights;
- `--button-primary` and `--button-primary-text` for primary actions.

The current implementation's accent is red, despite legacy CSS variable names
such as `--blue` and `--blue-text`: `#DD0200` in light mode and `#FF7772` for
dark-theme text accents. Do not describe the shipped palette as blue. Confirm
actual token definitions in `app/globals.css` before proposing a direction
change.

Do not use hard-coded white, black, or light-only borders in shared
components. Lock colors and fonts into named tokens before implementation;
do not introduce inline colors or one-off font declarations mid-render.

Keep Geist Sans and Geist Mono. Prioritize readable measure, clear distinction
between headings and metadata, stable line lengths, and a consistent rhythm.
Do not add a font package without a deliberate brand decision.

Use the restrained radius scale already defined by the project:

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-pill: 999px;
```

---

## 6. Interaction, accessibility, and motion

Every interactive element must have keyboard access, an accessible name, a
visible focus state, a meaningful disabled state, and visible pressed
feedback. Use the existing skip link, semantic labels, and focus ring.

Use motion only for feedback, focus, navigation, or subtle state changes.
Prefer transform and opacity. Avoid route-blocking animation and fake loading
progress. Every new animation must document:

1. the user problem it solves;
2. its duration;
3. whether it can affect layout or cumulative layout shift;
4. its `prefers-reduced-motion: reduce` behavior.

Under reduced motion, stop decorative animation and use instant scrolling or
static equivalents. Loading states should be simple, non-disruptive, and
resemble the content they replace.

For scroll responsiveness, pause the catalog WebGL draw loop and directory
marquee while scroll events are active, then resume them after 180 ms without
scroll input. This changes no layout and adds no scroll delay. Native touch
scrolling remains unchanged, and reduced-motion users keep the static
equivalents. When a canvas backing buffer is resized, redraw it immediately so
the WebGL layer cannot remain transparent until the next animation frame.
Redraw the WebGL frame when the route changes or the canvas re-enters the
viewport, because client-side route restoration does not emit the browser's
`pageshow` event. The gallery iframe keeps its opaque black surface in dark
mode. In light mode its transparent canvas sits above the liquid layer with
normal compositing, so tile colors are not multiplied by the WebGL background.
Resume the gallery iframe on pathname changes as well. The dark-mode ring
texture and screen blend are unchanged. Light mode shares the same halftone dot
density, ink contrast, and grain settings, so the dot texture remains consistent
across themes. The light palette and red accent are retained.
Clicking the brand link while already on `/` returns to the top without
re-navigating, preserving the mounted hero and its WebGL context.

Route loading skeletons follow the content structure they replace, including
category cards, multi-field forms, editorial sections, and the comparison
view's empty or populated state.

---

## 7. AgentNine component rules

- **Header:** sticky, under roughly 80px, one desktop row, keyboard-safe mobile
  menu, stable brand link, active route state, and one primary browse action.
- **Footer:** quiet and information-oriented; use semantic tokens and do not
  create a second visual identity.
- **AgentCard:** show category, verification state and five-segment score,
  name, description, first four tags, stars when available, and source/guide
  links.
- **SearchBox:** keep fuzzy search client-side, synchronize filters to URL
  parameters, and do not request on every keystroke.
- **SetupStepper:** distinguish missing validated steps from runtime failure;
  provide upstream README context without implying it was validated.
- **Feedback and analytics:** report failed writes as failures; keep identity
  and analytics privacy-conscious and bounded.
- **Admin:** show explicit success and error states, preserve CSRF support, and
  never imply that unavailable audit or queue features exist.

---

## 8. Required workflow for future design changes

1. Read `README.md` and this file.
2. Inspect the existing route and component before editing.
3. State the exact files expected to change; do not delete production files
   without explicit approval.
4. Decide the page structure and design intent before writing CSS.
5. Select a small, relevant set of Design Skills references.
6. Use Hallmark's structural-variety and pre-emit critique principles.
7. Apply antislop core plus only the relevant additive skills.
8. Change semantic tokens before adding one-off selectors.
9. Remove unsupported claims and decorative UI that does not help users.
10. Check light and dark themes and all required mobile widths.
11. Run the delivery gate:

```text
[ ] Product claims are backed by real data or clearly marked as unavailable.
[ ] No invented metrics, testimonials, logos, or proof.
[ ] The page has a deliberate, content-driven structure.
[ ] Shared surfaces use semantic tokens in both themes.
[ ] Keyboard, focus, disabled, pressed, and reduced-motion states work.
[ ] No horizontal overflow at required widths.
[ ] Loading and failure states are honest and useful.
[ ] Existing route, data, and component behavior remains intact.
[ ] Pre-emit critique: philosophy, hierarchy, execution, specificity,
    restraint, and variety each score at least 3/5.
[ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass.
```

---

## 9. Source names for website attribution

The design system may reference these inspirations in internal documentation
or an about/design credits surface, using their names and links:

1. **tasteskill v2 (experimental)** — AgentNine's original product design rules.
2. **Design Skills** — <https://designskills.dev>
3. **Hallmark** — <https://github.com/nutlope/hallmark>
4. **antislop** — <https://github.com/miqdadbadjuber/anti-slop>

Do not imply endorsement, ownership, certification, or direct inclusion of
third-party code unless the relevant package or skill is actually installed
and its license and attribution requirements have been checked.
