import { getDemoBySlug } from "@/content/demos";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { WarningNote } from "@/components/ui/WarningNote";
import { GhostPill } from "@/components/ui/GhostPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { DemoLogo } from "@/components/ui/DemoLogo";
import { CardActions } from "@/components/interactive/CardActions";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import type { Demo } from "@/content/types";

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Shared "chip" treatment for the per-demo language note (2026-07-22 pl-copy handoff §6) —
// mirrors DemoModalContent's local constant (ui/ is frozen, so no new shared primitive).
const LANG_CHIP_CLASS =
  "inline-flex items-center rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70";

// Server component (SPEC §16 client/server boundary) — the section renders static content;
// interactivity (opening the demo detail modal) lives in the frozen `CardActions` client leaf.
// Whole-card click = the stretched "View details" pill (CardActions kind="demo-card"); the
// external "Open the demo ›" link is a raised sibling (relative z-10) above the stretched
// hit-area — no nested interactives (mirrors the case-card pattern; the retired service-card
// start/learn split used the same sibling-CTA precedent).
//
// 2026-07-20 demos-v2: the homepage now shows only the 3 `site.featuredDemoSlugs` as bigger
// cards with a screenshot (resolved by slug, never index — a missing/renamed slug just drops
// silently instead of crashing the page); the full 5-demo index moved to /demos/ (see docs/
// superpowers/specs/2026-07-20-demo-detail-modal-and-demos-subpage-design.md). The demo-card
// markup below is intentionally duplicated in src/app/demos/page.tsx (same precedent as
// CaseStudies.tsx/work/page.tsx duplicating the case-card markup).
export function Demos() {
  const featured = site.featuredDemoSlugs
    .map((slug) => getDemoBySlug(slug))
    .filter((d): d is Demo => d !== undefined);

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading
        id="demo-heading"
        line1={site.sections.demos.line1}
        line2={site.sections.demos.line2}
      />

      <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-6">
        {featured.map((d) => (
          <div
            key={d.slug}
            className={`card-host relative flex flex-col overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface ${HOVER_LIFT}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image */}
            <img
              src={d.shot}
              alt={d.shotAlt}
              width={1440}
              height={900}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full border-b border-border-08 object-cover object-top"
            />
            <div className="relative flex flex-1 flex-col gap-3 px-7 pt-7">
              {/* Decorative glow + mono watermark — presentational, hidden from AT. */}
              <span
                aria-hidden="true"
                className="card-glow -right-[80px] -top-[40px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
              />
              <span aria-hidden="true" className="absolute right-[26px] top-5">
                <Watermark />
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <Chip tone="accent">{d.tag}</Chip>
                {d.uiLang === "en" && (
                  <span className={LANG_CHIP_CLASS}>{site.sections.demos.langChip}</span>
                )}
              </div>
              <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">
                {d.logoId ? (
                  <DemoLogo logo={d.logoId} instanceId="card" className="h-7 w-auto" />
                ) : (
                  d.name
                )}
              </h3>
              <p className="text-[14.5px] leading-[1.55] text-ink-70">{d.description}</p>
              {/* Desktop-only staff panels (HealthLab, Merdi Panel) get a warning caveat before
                  the external "Open the demo" link — see docs/superpowers/specs/
                  2026-07-21-desktop-only-demo-note-design.md ("Warning treatment" revision). */}
              {d.desktopOnly && <WarningNote>{site.sections.demos.desktopNote}</WarningNote>}
            </div>

            {/* Whole-card click = View details (stretched via CardActions). The external "Open
                the demo" link is a sibling raised above the stretched hit-area (relative
                z-10) — same sibling-CTA pattern as the case card. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-7 pb-7 pt-4">
              <CardActions
                kind="demo-card"
                demoSlug={d.slug}
                readLabel={site.sections.demos.detailCta}
                ariaLabel={`Zobacz szczegóły: ${d.name}`}
              />
              <span className="relative z-10">
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Otwórz demo: ${d.name}`}
                  className={`inline-flex w-fit rounded-[var(--radius-pill)] ${PILL_FOCUS}`}
                >
                  <span className="relative z-[1] inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-4 py-2 text-[14.5px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:text-white">
                    {site.sections.demos.cta}
                  </span>
                </a>
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-7 text-[13.5px] text-ink-50">{site.sections.demos.footnote}</p>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <GhostPill tone="accent" size="lg" as="a" href="/demos/">
          {site.sections.demos.seeAllCta}
        </GhostPill>
        <p className="m-0 text-[15px] text-ink-70">{site.sections.demos.calendly.prompt}</p>
        <CalendlyCta variant="filled" label={site.sections.demos.calendly.cta} />
      </div>
    </section>
  );
}
