# Handoff: calm_soft — Software House Landing Page

## Overview
Single-page marketing site for **calm_soft**, a Polish software house selling four services (Web solutions, Automation, Core systems & integrations, Refactor & rescue). The page's job is lead generation: every path (hero CTA, service cards, service modal, case-study modal) funnels into the project-inquiry form at `#contact`. Includes two overlay modals (service overview, case study), a 4-step process carousel, and a validated inquiry form with a success state.

## About the Design Files
`Landing Page.dc.html` is a **design reference created in HTML** — a working prototype showing intended look and behavior, not production code to copy directly. Open it in a browser (keep `support.js` next to it — it is only the prototype's runtime, ignore it for implementation). The task is to **recreate this design in the target codebase's environment** (React/Next.js, Vue, etc.) using its established patterns — or, if no codebase exists yet, pick an appropriate stack (this design maps naturally to React + CSS-in-JS or Tailwind).

All copy, case-study content and service-modal content live in the file's `<script>` block as the `cases[]`, `services[]` and `steps[]` arrays — treat those as the content source of truth.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, hover states and copy are final. Recreate pixel-perfectly.

## Theme
Dark theme only. Two accent variables drive all color accents:

- `--accent: #7ce38b` (green — brand color)
- `--accent2: #b9f0c4` (mint — secondary accent)

Green is the only palette — the bundled prototype and screenshots render with it. Keep both values as CSS custom properties; accent tints are derived, never hardcoded: backgrounds `color-mix(in oklch, var(--accent) 15–22%, transparent)`, borders at `32–55%`.

## Screens / Views

### 1. Nav (sticky)
- Sticky top, z-50, `backdrop-filter: blur(20px) saturate(1.8)`, bg `rgba(0,0,0,0.65)`, bottom border `rgba(255,255,255,0.08)`, inner max-width 1024px, height 64px, padding 0 24px.
- Logo: mono stack (`ui-monospace, 'SF Mono', Menlo, monospace`), 26px/600, letter-spacing −0.02em: `calm` + `_` (accent color, blinks: opacity 1→0 steps, 1.2s infinite) + `soft`.
- Links (Services, Process, Case studies): 15px, `rgba(245,245,247,0.85)`, hover `#fff`.
- CTA "Start a project": pill (radius 980px), accent bg, black text, 15px/600, padding 8px 20px, hover `brightness(1.15)`, transition `filter 0.25s`.
- *Prototype has no mobile menu — add a hamburger below ~768px during implementation.*

### 2. Hero (3 variants; "code" ships as default)
Shared: min-height 88vh, eyebrow `Web · Automation · Core systems · Refactoring` 13px/600 uppercase letter-spacing 0.12em accent; lead paragraph 20px/1.5 `rgba(245,245,247,0.72)`; primary CTA pill 17px/600 padding 12px 28px.
- **B "code" (default):** max-width 1200, padding 100px 24px, grid `1.1fr 1fr` gap 64 (stack on mobile). Background radial glow: ellipse 60%×50% at 75% 50%, accent at 14% → transparent 70%. Left: h1 `clamp(44px, 5.5vw, 72px)`/700/−0.03em/1.05 "Software your business can lean on."; secondary link "See how we work ›" (ghost pill: accent text, 17px/500, padding 12px 28px, hover: accent 16% bg + 40% border + white). Right: floating fake code window (animation floatY 7s ease-in-out infinite, translateY 0→−14px): radius 16, bg `rgba(28,28,30,0.9)`, border `rgba(255,255,255,0.1)`, shadow `0 40px 80px rgba(0,0,0,0.6), 0 0 60px accent@12%`; title bar with 11px traffic lights (#ff5f57 #febc2e #28c840) and mono 12.5px title; body mono 13.5px/1.75 with syntax colors: keyword `#ff7ab2`, fn `#6bdfff`, string `#a8e28a`, success line `#7ce38b`; blinking 8×16px accent cursor (1.1s).
- **A "aurora":** centered column, max-width 900, two drifting radial glow circles (900px accent@28%, 800px accent2@20%; keyframes glowDrift 18s / glowDrift2 22s), h1 `clamp(56px, 8vw, 96px)`, two CTAs (filled + outlined `rgba(255,255,255,0.25)` border, hover white border).
- **C "type":** max-width 1100, h1 `clamp(60px, 9vw, 130px)`/−0.045em; line 1 `rgba(245,245,247,0.35)` "Complex problems."; line 2 gradient text (90deg accent→accent2→accent, background-size 200%, animation gradShift 8s) "Calm software."

### 3. Services (`#services`)
- Section: max-width 1200, padding 110px 24px. H2 `clamp(36px, 4.5vw, 56px)`/700/−0.025em, two lines — second line `rgba(245,245,247,0.45)`.
- Grid: `repeat(auto-fit, minmax(min(100%, 420px), 1fr))` gap 18, margin-top 48. 4 cards.
- Card: radius 28, bg `#101012`, border `rgba(255,255,255,0.08)`, padding 36px 30px, column gap 18, overflow hidden, cursor pointer; decorative radial glow circle 320px at top-right (−120px offsets), accent@18%. Hover: `translateY(-4px)` + border accent@50% (cards 1 & 4 use accent, cards 2 & 3 use accent2), transition 0.35s.
- Card contents: eyebrow 13px/600 uppercase accent(2); title 24px/700/−0.02em/1.15; body 15px/1.55 `rgba(245,245,247,0.7)`; 4 chips (13.5px/500 pills, accent(2)@15% bg, @32% border, padding 8px 16px); footer row (flex, gap 0):
  - "Start with this service ›" — accent 14.5px/500 ghost pill (padding 8px 16px, margin-left −16px; hover accent@16% bg + @40% border + white). Click **does not open the modal** — goes straight to the form (see Interactions).
  - "Learn more ›" — same pill in `rgba(245,245,247,0.5)`, hover `rgba(255,255,255,0.07)` bg + `0.22` border + white. No own handler — card click opens the service modal.
- **Card click → Service modal** for that service.

### 4. Service modal
- Overlay: fixed inset 0, z-100, `rgba(0,0,0,0.72)` + `blur(14px)`, padding 32, centers card; click closes.
- Card: radius 28, bg `#101012`, border `rgba(255,255,255,0.12)`, `max-width: min(1080px, 94vw)`, `max-height: 92vh`, padding `clamp(24px,4.5vh,40px) clamp(24px,3.5vw,46px)`, column gap `clamp(14px,2.4vh,22px)`, `overflow-y: auto` **only as a safety net** — layout is designed to fit desktop viewports without scrolling.
- Close: 36px circle top-right (20/24px offsets), border `rgba(255,255,255,0.2)`, "×", hover accent border + white.
- Content order: tag pill (12.5px, tone accent/accent2 by service) + "Service overview" 13px `0.5`; headline `clamp(22px,3.4vh,30px)`/700 (max-width 860); intro 15px/1.55 `0.7` (max-width 860); **grid 1** `auto-fit minmax(min(100%,300px),1fr)` gap `clamp(18px,2.5vw,34px)`: left "WHEN IT'S THE RIGHT CALL" (section label 13px/600 uppercase accent) + ✓ list (accent ✓ 14px, text 14px/1.5 `0.7`, row gap 9); right "WHAT WE DELIVER" + inner grid `minmax(min(100%,210px),1fr)` gap 12/20 of name (14.5px/600) + desc (13px/1.45 `0.6`); **grid 2** same cols: left "HOW WE RUN IT" paragraph 14px/1.55 `0.7`; right "PROOF FROM OUR WORK" — 1–2 mini case cards (flex 1 1 240px, radius 16, bg `rgba(255,255,255,0.04)`, border `0.1`, padding 18px 20px; metric 26px/700 accent, headline 14px/600/1.35, "Read the story ›" 13px ghost pill; hover: border accent@45% + translateY(−2px)) — **click switches to that case-study modal**; footer row (top border `0.08`, padding-top 22): filled CTA "Start with this service ›" 15px/600 padding 12px 28px + note 12.5px `0.45` "A senior engineer replies within 24 hours · NDA on request."
- Content for all four services: `services[]` array in the HTML file (intro, 4 fit bullets, 5–6 deliverables, approach, related case indices).

### 5. Process (`#process`) — carousel
- Header row: H2 (same scale) + prev/next: 44px circles, border `rgba(255,255,255,0.2)`, ‹ › 24px; hover accent border + `rgba(255,255,255,0.05)` bg; disabled end → opacity 0.35.
- Track: overflow hidden; slides flex gap 18; transform `translateX(step * (−100% − 18px))`, transition `0.65s cubic-bezier(0.32, 0.72, 0, 1)`.
- Slide: full-width card radius 28 bg `#101012`, padding 64, min-height 320, grid `0.9fr 1.1fr` gap 56; radial glow 460px top-right; watermark logo mono 24px/600 `rgba(245,245,247,0.55)` at top 28/right 34.
- Left: mono step number 18px accent (`00…03`) + optional badge pill (13.5px, accent2 tint — step 00 has "Billed separately"); title `clamp(34px,4vw,48px)`/700. Right: description 18px/1.6 `0.7` max-width 560.
- Dots: mono 13px pills (padding 9px 16px); active: accent@22% bg + @45% border + white text; inactive: transparent, border `rgba(255,255,255,0.16)`, text `0.55`.
- Steps content: `steps[]` in file — 00 Discover (DDD workshop), 01 Design, 02 Build, 03 Handover.

### 6. Case studies (`#cases`)
- H2 "Proof, not promises." + subline. Featured card (case 0): radius 28, padding 44px 48px, grid `1.25fr 0.75fr` gap 48; left: tag pill 12.5px + client 13px `0.5`, headline 30px/700/1.12, teaser 15px/1.55 `0.7`, "Read the story ›" 14.5px ghost pill; right: two metrics — value 52px/700/−0.03em (first accent, second white) + label 13.5px `0.55`. Watermark + glow as process cards. Hover translateY(−4px) + accent border. Click → case modal.
- Grid: `auto-fit minmax(min(100%,330px),1fr)` gap 16, 5 cards: radius 20, padding 28, watermark mono 24px; tag pill, metric 30px accent, headline 16px/600/1.3, client 13px `0.5`, "Read the story ›" 14.5px ghost pill pinned bottom (`margin-top: auto`). Hover same.
- Footnote 13.5px `0.45`: "References and technical deep-dives available on request."

### 7. Case-study modal
Same overlay/card shell as service modal. Content: tag pill + client; headline `clamp(22px,3.4vh,30px)` (max-width 860); metrics row (gap 44): value `clamp(30px,5vh,40px)`/700 (m1 accent, m2 white — m2 optional) + label 13.5px `0.55`; **3-column grid** `auto-fit minmax(min(100%,250px),1fr)` gap `clamp(16px,2.5vw,30px)`: CHALLENGE / APPROACH / RESULTS (labels 13px/600 uppercase accent; paragraphs 14px/1.55 `0.7`); tech-tag pills 12.5px (neutral: bg `rgba(255,255,255,0.06)`, border `0.1`, text `0.7`); footer: filled CTA "Start a similar project ›" + note. All 6 case studies' full copy: `cases[]` array.

### 8. Contact (`#contact`)
- Section: top border `rgba(255,255,255,0.06)`, bottom-center radial glow (1000×500px accent@22%), inner max-width 1200, padding 120px 24px 100px, grid `0.85fr 1.15fr` gap 64.
- Left: H2 "Let's build something that lasts."; paragraph 18px/1.55 `0.7`; mailto link accent 17px/500 hover white; 3 ✓ rows (accent ✓ 15px + text 14.5px `0.7`).
- Right form card: radius 28, bg `#101012`, border `0.08`, padding 40. Header: mono logo 24px + "PROJECT INQUIRY" 12.5px uppercase 0.08em `0.45`.
- Inputs (Name, Email, Company (optional), Phone (optional)) in 2×2 grid gap 14: label 13px/500 `0.6`; input bg `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.12)`, radius 12, padding 13px 15px, 15px text; placeholder `rgba(245,245,247,0.35)`; focus: accent border, no outline.
- "WHICH SERVICE DO YOU NEED?" (form section labels: 13px/600 uppercase 0.12em `rgba(245,245,247,0.5)`): 2×2 option cards radius 14 padding 16px 18px — label 15px/600 + sub 12.5px `0.55`; selected: accent@16% bg + @55% border; idle `rgba(255,255,255,0.04)` / border `0.1`.
- Textarea "Tell us about your project": min-height 110, resize vertical.
- "SHAPE THE ENGAGEMENT": two toggle cards radius 16 padding 20px 22px with 26px check circle (checked: accent(2) fill, black ✓) — "Start with a Discover workshop" (badge `RECOMMENDED` 12px/600 uppercase accent@20% bg) and "Handover with a maintenance plan" (badge `PEACE OF MIND`, accent2). Both **default ON**. Checked bg accent(2)@10% + border @45%.
- "FIRST MEETING": 2 segmented buttons radius 14 padding 13 ("Online" default / "On-site at your office"), selected accent@16%/55%.
- Submit: full-width pill "Send request" 16px/600 padding 15. Validation on click: name non-empty; email `/.+@.+\..+/`. Errors: input border `rgba(255,138,128,0.8)` + centered message 13px `#ff8a80` "Please add your name and a valid email so we can get back to you." — cleared on input.
- Success state (replaces form): centered, 64px ✓ circle (accent@22% bg, accent border), "Request sent." 30px/700, paragraph 16px `0.7` max-width 380, "Send another request ›" ghost pill 14.5px/500 (resets), small mono logo `0.45`.
- Fine print under submit: 12.5px `0.45` "A senior engineer replies within 24 hours · NDA on request".

### 9. Footer
Top border `0.08`; max-width 1024, padding 28px 24px; left: mono logo 18px + "© 2026 · All rights reserved." 12px `0.5`; right: 4 links 12px `0.5` hover white.

## Interactions & Behavior
- **Ghost-pill hover (all text links/CTAs):** base transparent; hover = accent@16% bg + accent@40% 1px border + `#fff` text; gray variant = `rgba(255,255,255,0.07)`/`0.22`; `transition: all 0.25s ease`. Negative left margin equal to horizontal padding keeps text optically aligned.
- **Filled-pill hover:** `filter: brightness(1.15)`, `transition: filter 0.25s ease`.
- **Card hover:** `translateY(-4px)` + accent(2)@45–50% border, 0.35s.
- **Service card click** → open service modal. **"Start with this service ›" click** → `stopPropagation`, select that service in the form + smooth-scroll to `#contact` (offset −32px).
- **Service modal:** CTA closes modal → same select+scroll. Related-case card closes service modal and opens that case modal.
- **Case modal "Start a similar project ›":** closes modal → selects the case's `serviceId` in form + scroll.
- **Modals close on:** backdrop click, × button (content clicks stop propagation). *Add Esc-to-close and background scroll-lock in implementation; use proper `dialog`/aria semantics and focus trap.*
- **Carousel:** prev/next clamp to 0–3; dots jump directly; arrows fade to 0.35 opacity at bounds (still rendered).
- **Form:** all selection state is client-side; on submit (valid) show success panel. Wire real submission to the backend (email templates for it already exist in `email-templates/` — confirmation + internal summary, Handlebars).
- **Animations (keyframes):** `blink` (1.1–1.2s, steps for logo), `floatY` 7s, `glowDrift` 18s / `glowDrift2` 22s, `gradShift` 8s. `html { scroll-behavior: smooth }`.
- **Responsive:** grids use `auto-fit/minmax` and collapse naturally; hero B/contact grids and the nav need explicit mobile handling (stack columns, hamburger). Modals: columns stack; keep `overflow-y: auto` fallback so content is never clipped on small screens. Hit targets ≥ 44px.

## State Management
- `heroVariant: 'aurora' | 'code' | 'type'` (config; ship `'code'`)
- `step: 0–3` (carousel) · `caseIdx: number|null` (case modal) · `svcIdx: number|null` (service modal)
- Form: `service: 'web'|'automation'|'core'|'refactor'|null`, `meeting: 'online'|'onsite'`, `discover: true`, `handover: true`, `sent: false`, `missingName/missingEmail`
- Content models: `cases[]` (serviceId, tone a|b, tag, client, headline, teaser, m1v/m1l, m2v/m2l, challenge, approach, results, tags[]) and `services[]` (id, tone, tag, headline, intro, fit[], deliver[{n,d}], approach, related[caseIdx]). No data fetching — static content.

## Design Tokens
- **Colors:** canvas `#000`; surface `#101012`; surface-2 `rgba(255,255,255,0.04–0.07)`; text `#f5f5f7` at alphas 1 / 0.85 / 0.72 / 0.7 / 0.6 / 0.55 / 0.5 / 0.45 / 0.35; borders `rgba(255,255,255,0.08 / 0.1 / 0.12 / 0.2 / 0.25)`; accent `#7ce38b`; accent2 `#b9f0c4`; error `#ff8a80` (border `rgba(255,138,128,0.8)`); code syntax `#ff7ab2 #6bdfff #a8e28a #7ce38b`; traffic lights `#ff5f57 #febc2e #28c840`. Accent tints via `color-mix(in oklch, accent N%, transparent)`: bg 10/15/16/18/20/22%, borders 32/40/45/50/55%.
- **Fonts:** UI `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, sans-serif`; mono `ui-monospace, 'SF Mono', Menlo, monospace` (logo, step numbers, dots, timestamps).
- **Type scale:** 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 16 / 17 / 18 / 20 / 22 / 24 / 26 / 30 / 52 px + clamps for h1/h2/modal headings (above). Weights: 400 body, 500 links/badges-500, 600 buttons/labels/titles-s, 700 headlines. Headline tracking −0.02…−0.045em; label tracking +0.12em (uppercase).
- **Spacing:** section padding-y 110–120px; card padding 36/30 (services), 44/48 (featured), 28 (grid cards), 40 (form), 64 (process); grid gaps 16–18 (cards), 48–64 (2-col layouts); element gaps 8–26.
- **Radii:** 28 (cards/modals), 24 (email-ish blocks), 20 (grid cards/modal inner cards), 16 (mini cards/toggles), 14 (pickers/summary), 12 (inputs), 980 (pills/buttons).
- **Motion:** 0.25s links/buttons · 0.3s form controls · 0.35s cards · 0.65s carousel (`cubic-bezier(0.32,0.72,0,1)`).

## Assets
None required — the logo is styled text (mono + accent underscore). A green logo pack (PNG: avatar 1024, banners 1600×400, transparent variants) exists in the project's `logo/` folder for favicon/OG-image use. No stock images or icon fonts; ✓ ‹ › × are text glyphs.

## Files
- `Landing Page.dc.html` — the full high-fidelity prototype (markup + all content arrays + interaction logic in the `Component` class).
- `support.js` — prototype runtime only; needed to open the HTML locally, irrelevant to implementation.
- `screenshots/` — reference captures (909×540 viewport crops): `01-hero`, `02-services`, `03-service-modal-1/-2` (top/bottom of the modal), `04-process`, `05-process-slide-01`, `06-case-studies`, `07-case-modal-1/-2`, `08-contact-form`, `09-form-validation-error`, `10-form-success`. All rendered with the green palette.
- Related but out of scope here: `email-templates/` (Node.js Handlebars templates for the form's emails), `logo/` (brand PNGs).
