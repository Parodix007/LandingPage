# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical rules

- **Never run state-changing git commands** (add/commit/branch/push/etc.). The user performs ALL
  git operations himself. Read-only git (status, log, diff) is fine. When a workflow says
  "commit", skip it and list the files ready for the user to commit.
- The mockup is binding **visually only** — architectural decisions live in the spec
  (`docs/superpowers/specs/2026-07-08-calm-soft-landing-design.md`), which is the source of
  truth for contracts, priority rules, and Definition of Done. Read it before implementing.
- **Priority rules**: WCAG AA beats mockup fidelity (corrected alpha tokens in spec §11);
  "pixel-perfect" applies to desktop only — mobile follows spec §7.
- Keep the site lightweight: no webfonts (system font stack), no content images, no state
  libraries. Perf gate is Lighthouse Performance ≥95 mobile (spec §13), not a raw JS budget —
  the Next 16 + React 19 framework floor alone is ~160 KB gz, so the old ≤140 KB target is
  moot; ~195 KB gz First Load is the advisory ceiling. Animations use transform/opacity only.
- CSP + security headers ship as a generated `out/.htaccess` (postbuild, Hostinger/LiteSpeed
  target) — static export has no request-time nonce, so `script-src` needs `'unsafe-inline'`
  plus `https://challenges.cloudflare.com` (documented, owner-accepted deviation from the API
  doc's strict block; spec §8.5). Cloudflare Turnstile loads at form mount in every mode,
  including mock — re-measure Lighthouse ≥95 mobile after any change touching it.
- **The form mock is never a silent fallback**: mock only when `NEXT_PUBLIC_INQUIRY_MOCK` is
  explicitly set (`1` = success, `fail` = failure); mock short-circuits before any Turnstile
  `execute()` call. The prebuild guard (`scripts/assert-env.mjs`) fails a build with neither
  `NEXT_PUBLIC_API_BASE_URL` nor the mock flag, fails a prod build (API base set) without
  `NEXT_PUBLIC_SITE_URL`, and fails an API-base build without `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  or with a base URL that isn't a bare https origin (path/query/trailing slash).
- **No nested interactive elements** (axe `nested-interactive`): cards are non-interactive
  containers; "whole-card click" is a real stretched `<button>` ("Learn more ›" with
  `::after { inset: 0 }`), sibling CTAs sit above it with higher z-index. `stopPropagation`
  is never needed. Animations are transform/opacity only (sole allowed exception: `gradShift`
  in the non-default `type` hero variant).

## What this is

Single-page marketing/lead-gen landing for **calm_soft**, a Polish software house. Dark theme
only, green accent (`#7ce38b` / mint `#b9f0c4`), English copy (`<html lang="en">`). Every CTA
funnels into the project-inquiry form at `#contact`.

Visual source of truth (outside this repo — content/tokens must be extracted into the repo
before component work; agents consume repo files only):

- Handoff README (design tokens, exact dimensions, hover states, all copy):
  `..\calm_soft_makieta\design_handoff_landing_page\README.md`
- HTML prototype (content arrays `services[]`, `cases[]`, `steps[]` in its `<script>` block are
  the copy source): `..\calm_soft_makieta\design_handoff_landing_page\Landing Page.dc.html`
- Screenshots (desktop 909×540 crops — the visual-review reference):
  `..\calm_soft_makieta\design_handoff_landing_page\screenshots\`
- Logo pack (favicon/OG derivation only — the on-page logo is styled text): `..\logo_calm_soft\logo\`

## Stack

Node 22 (`.nvmrc`), Next.js 16 (App Router, Turbopack) + TypeScript strict, **full static export**
(`output: 'export'`, `trailingSlash: true`), Tailwind CSS v4, Vitest + React Testing Library
(`@testing-library/react@^16` for React 19), npm. Static export constraints: no API routes,
no middleware, no `next/image` optimization; all `NEXT_PUBLIC_*` env vars are **build-time**
(inlined into the bundle — changing them requires rebuild + redeploy).

**Tailwind v4 pattern** (common failure mode: v3 habits): `@import "tailwindcss"` + `@theme`
in `globals.css`. No `tailwind.config.js`, no `@tailwind base/components/utilities`.

## Commands

```
npm run dev          # dev server (mock enabled via committed .env.development)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest run (all tests)
npm run build        # prebuild env guard + static export → out/
npm run build:mock   # explicit-mock build for local gates (next build does NOT read .env.development)
npm run preview      # serve out/ (required for Lighthouse and export smoke checks)
npx vitest run path/to/file.test.tsx        # single test file
npx vitest run -t "test name"               # single test by name
```

DoD gate per task: `typecheck && lint && test && build:mock` all green. The env guard
(`scripts/assert-env.mjs`) loads env files the same way `next build` does (`@next/env`,
production mode). Never "fix" a red build by weakening the guard or adding `.env*` files —
escalate instead. Lighthouse (target ≥95 mobile, all categories) is measured against
`npm run preview`, never `next dev`.

## Environment variables (all build-time)

Documented in `.env.example`. `NEXT_PUBLIC_API_BASE_URL` (API **origin only**, no path — the
guard rejects a value with path/query/trailing slash; `lib/inquiry.ts` appends
`/api/contact/token` and `/api/contact` itself; required in prod unless mock is explicit),
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public Cloudflare Turnstile site key, not a secret; required
whenever `NEXT_PUBLIC_API_BASE_URL` is set), `NEXT_PUBLIC_INQUIRY_MOCK` (`1`|`fail`),
`NEXT_PUBLIC_SITE_URL` (origin for metadataBase/canonical/OG — required for prod builds),
`NEXT_PUBLIC_ANALYTICS_SRC` + `NEXT_PUBLIC_ANALYTICS_DOMAIN` (cookieless analytics; script
renders only when both set).

## Architecture

- `src/content/` — typed TS modules (`services.ts`, `cases.ts`, `steps.ts`, `site.ts`)
  mirroring the prototype's content arrays, plus ALL page copy (hero variants, section
  headings, form labels/messages) — **components hardcode no content strings**. Case studies
  have stable `slug`s; services reference them via `relatedSlugs` (never array indices).
- **Client/server boundary is leaf-level**: sections (Hero, Services, Process, CaseStudies,
  Contact) and Nav/Footer are server components. `'use client'` only on:
  `NavMobileMenu`, `CardActions`, `ProcessCarousel`, `ContactForm`, and providers.
  Providers (`InquiryProvider`, `ModalProvider`+`ModalRoot`) are dedicated `'use client'`
  files taking server-rendered sections as `children` — `page.tsx` stays a server component
  (never put `'use client'` on it).
- **State contracts** (binding signatures in spec §6.2): `InquiryContext`
  (`selectedService`, `selectService()`, `requestContactScroll()`,
  `focusSelectedServiceRadio()`) and `ModalContext`
  (`openServiceModal(id)`, `openCaseModal(slug)`, `closeModals()`). `ModalRoot` owns both
  modals' state and renders ONE `Modal` instance with swapped content — scroll-lock and focus
  trap persist across the service→case switch. Focus returns to the original opener on
  Esc/backdrop/× close; closing via a CTA instead moves focus to the selected service radio
  in the form (`preventScroll` — never fight the scroll to `#contact`).
- **Backend boundary**: `src/lib/inquiry.ts` + `src/lib/turnstile.ts` — a 3-step secured
  submit, not a single POST. `submitInquiry(fields, turnstileToken)` does `GET
  {NEXT_PUBLIC_API_BASE_URL}/api/contact/token` (one-time `formToken`) then `POST
  {NEXT_PUBLIC_API_BASE_URL}/api/contact` with `{...fields, formToken, turnstileToken}`
  (`InquiryFields` has no `elapsedMs`; `service` is non-null); env is read at call time inside
  one 10 s `AbortController` spanning both requests. `submitWithRetry(fields,
  executeTurnstile)` retries exactly once, only on HTTP 403, with both tokens refreshed.
  2xx = success; any other status/network/timeout throws `InquiryError({ status?,
  serverMessage? })` — `serverMessage` is parsed from the response body when present, else a
  generic fallback is shown; retry/no-retry is decided on status only, never on body content.
  `src/lib/turnstile.ts` (client-only) owns the Cloudflare Turnstile widget: `loadTurnstile()`
  injects the script at form mount in every mode (including mock), `executeTurnstile()`
  resets before each execute and resolves via the widget callback. Real backend is a separate
  app (`calm_soft_api`); integration touches only these two files. CORS, the Origin gate,
  formToken signing/TTL, Turnstile `siteverify`, honeypot evaluation, and per-IP rate limits
  are all server-side.
- **Scroll**: anchor offsets via CSS `scroll-margin-top` (no position math); scrolling lives
  in mockable `lib/scroll.ts`; modal CTA sequence = close → unlock → rAF → scroll. All anchor
  links are root-relative (`/#services`) to survive future subpages.
- **Hero variants**: `aurora` | `code` | `type`, single source: constant in `src/lib/config.ts`
  (`code` is default). All CSS animations respect `prefers-reduced-motion`.
- **Forms are native inputs** styled as cards (radio/checkbox/fieldset), status messages in
  `role="status"` live regions; tests address controls via `getByRole`/`getByLabelText` —
  that is the contract between form and test work.

## Testing policy

Test logic, not presentation — but jsdom has hard limits the architecture accounts for:
scroll and matchMedia are stubbed in `src/test/setup.ts`; tests assert calls to `lib/scroll`
mocks, never real scroll positions; carousel transform is an inline style (assertable);
arrow bounds use `aria-disabled`. Only client components and `lib/`/`content/` modules are
unit-tested — `page.tsx`/`layout.tsx` (RSC) are verified by `npm run build` + preview smoke
checks. `ContactForm` tests mock the whole `lib/inquiry` module and the Turnstile executor;
`inquiry.ts` has its own unit tests for both API and mock branches, and `turnstile.ts` has its
own tests against a stubbed `window.turnstile` (the real widget isn't jsdom-testable — build +
preview smoke covers that). Required cases: spec §14.2 (exact payload key set with no stray
field, status map incl. retry-exactly-once-on-403, double-submit = one execute + one GET + one
POST, modal focus/lock across service→case switch, per-field validation messages — each
invalid field shows its own message wired via `aria-invalid` + `aria-describedby`, email/phone
validated by regex (email distinguishes empty vs malformed; phone optional, format-checked only
when non-empty and still omitted from the payload when blank), focus moves to the first invalid
field on failed submit).

## AI delivery model

- Work runs as a **multi-agent architecture**: the main session (orchestrator) designs,
  delegates, integrates and verifies — it does not write production code directly.
- **Code implementation must be performed by Sonnet 5 subagents** (Agent/Workflow calls with
  `model: 'sonnet'`).
- Blocking sequence before any parallel fan-out: Task 0 (scaffold, spec §3, green gates) →
  content/token/asset extraction into the repo (spec §5.3, §12.2) → shared UI primitives with
  binding props (spec §6.9) → state core & lib (providers, `lib/`, `CardActions`, `app/`
  composition with section skeletons, integration tests) → then parallel section
  implementation against the integration contracts (spec §16).
- During fan-out, a section agent writes only its own section + tests — including its modal
  content (`ServiceModalContent` → Services agent, `CaseModalContent` → CaseStudies agent);
  `ui/`, `providers/`, `lib/`, `content/`, `app/`, and `interactive/CardActions` are frozen —
  changes there go through the orchestrator.
- Visual review (909×540 + 1280×800 vs `screenshots/`) and the Lighthouse measurement
  (`npx lighthouse` against `npm run preview`) are performed by the orchestrator, not by
  implementation agents.
- Before declaring work complete, changes go through multi-perspective review workflows
  (skeptics / adversarial verification, judge panel, completeness critics) plus the DoD gates.
