import { getCaseBySlug } from "@/content/cases";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { GhostPill } from "@/components/ui/GhostPill";
import { CardActions } from "@/components/interactive/CardActions";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import type { CaseStudy, Tone } from "@/content/types";

// HANDOFF §6: chip/metric tint follows the case's own tone (a → accent, b → accent2), but
// card-hover border is always accent regardless of tone (prototype hard-codes `--accent` for
// both the featured and grid card hover states — unlike Services, which is tone-dependent).
const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Server component (SPEC §16 client/server boundary) — the section renders static content;
// interactivity (opening the case modal) lives in the frozen `CardActions` client leaf. The
// whole-card click is the stretched "Read the story" pill (SPEC §6.4, zero nested
// interactives) — no onClick lives on these card divs themselves.
//
// 2026-07-20 round2 polish: the homepage now shows only the 3 `site.featuredCaseSlugs` as
// big wide lead-style cards (story left, metrics right) stacked vertically (resolved by slug, never index — a missing/renamed slug just drops
// silently instead of crashing the page); the full case index moved to /work/.
export function CaseStudies() {
  const featured = site.featuredCaseSlugs
    .map((slug) => getCaseBySlug(slug))
    .filter((c): c is CaseStudy => c !== undefined);

  return (
    <section
      id="cases"
      aria-labelledby="cases-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading
        id="cases-heading"
        line1={site.sections.cases.line1}
        line2={site.sections.cases.line2}
      />

      {/* HANDOFF §1 sections.cases.intro — two lead lines above the case grid, styled like the
          other sections' lead paragraphs (max-width read line, ink-70 body copy). */}
      <div className="mt-5 flex max-w-[760px] flex-col gap-3">
        {site.sections.cases.intro.map((line) => (
          <p key={line} className="text-[16px] leading-[1.6] text-ink-70">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-4">
        {featured.map((c) => (
          <div
            key={c.slug}
            className={`card-host relative grid grid-cols-1 gap-12 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[44px_48px] min-[900px]:grid-cols-[1.25fr_0.75fr] min-[900px]:items-center ${HOVER_LIFT}`}
          >
            {/* Decorative glow + mono watermark — purely presentational, hidden from AT. */}
            <span
              aria-hidden="true"
              className="card-glow -right-40 -top-40 h-[460px] w-[460px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
            />
            <span aria-hidden="true" className="absolute right-[34px] top-7">
              <Watermark />
            </span>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Chip tone={TONE_CHIP[c.tone]}>{c.tag}</Chip>
                <span className="text-[13px] text-ink-50">{c.client}</span>
              </div>
              <h3 className="text-[30px] font-bold leading-[1.12] tracking-[-0.02em]">
                {c.headline}
              </h3>
              <p className="text-[15px] leading-[1.55] text-ink-70">{c.teaser}</p>
              <CardActions
                kind="case-card"
                caseSlug={c.slug}
                readLabel="Przeczytaj historię ›"
                ariaLabel={`Przeczytaj historię: ${c.client}`}
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="text-[52px] font-bold leading-none tracking-[-0.03em] text-accent">
                  {c.m1v}
                </div>
                <div className="text-[13.5px] text-ink-55">{c.m1l}</div>
              </div>
              {c.m2v ? (
                <div className="flex flex-col gap-1">
                  <div className="text-[52px] font-bold leading-none tracking-[-0.03em] text-white">
                    {c.m2v}
                  </div>
                  <div className="text-[13.5px] text-ink-55">{c.m2l}</div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <GhostPill tone="accent" size="lg" as="a" href="/work/">
          {site.sections.cases.seeAllCta}
        </GhostPill>
        <p className="m-0 text-[15px] text-ink-70">{site.sections.cases.calendly.prompt}</p>
        <CalendlyCta variant="filled" label={site.sections.cases.calendly.cta} />
      </div>

      <p className="mt-7 text-[13.5px] text-ink-50">{site.sections.cases.footnote}</p>
    </section>
  );
}
