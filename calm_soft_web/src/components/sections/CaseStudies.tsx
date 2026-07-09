import { cases, getCaseBySlug } from "@/content/cases";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { CardActions } from "@/components/interactive/CardActions";
import type { Tone } from "@/content/types";

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
export function CaseStudies() {
  const featured = getCaseBySlug(site.featuredCaseSlug);
  const gridCases = cases.filter((c) => c.slug !== site.featuredCaseSlug);

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

      {featured ? (
        <div
          className={`card-host relative mt-12 grid grid-cols-1 gap-12 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[44px_48px] min-[900px]:grid-cols-[1.25fr_0.75fr] min-[900px]:items-center ${HOVER_LIFT}`}
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
              <Chip tone={TONE_CHIP[featured.tone]}>{featured.tag}</Chip>
              <span className="text-[13px] text-ink-50">{featured.client}</span>
            </div>
            <h3 className="text-[30px] font-bold leading-[1.12] tracking-[-0.02em]">
              {featured.headline}
            </h3>
            <p className="text-[15px] leading-[1.55] text-ink-70">{featured.teaser}</p>
            <CardActions
              kind="case-card"
              caseSlug={featured.slug}
              readLabel="Read the story ›"
              ariaLabel={`Read the story: ${featured.client}`}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="text-[52px] font-bold leading-none tracking-[-0.03em] text-accent">
                {featured.m1v}
              </div>
              <div className="text-[13.5px] text-ink-55">{featured.m1l}</div>
            </div>
            {featured.m2v ? (
              <div className="flex flex-col gap-1">
                <div className="text-[52px] font-bold leading-none tracking-[-0.03em] text-white">
                  {featured.m2v}
                </div>
                <div className="text-[13.5px] text-ink-55">{featured.m2l}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
        {gridCases.map((c) => (
          <div
            key={c.slug}
            className={`card-host relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-7 ${HOVER_LIFT}`}
          >
            <span
              aria-hidden="true"
              className="card-glow -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
            />
            <span aria-hidden="true" className="absolute right-[26px] top-6">
              <Watermark />
            </span>

            <span className="self-start">
              <Chip tone={TONE_CHIP[c.tone]}>{c.tag}</Chip>
            </span>
            <div className="text-[30px] font-bold leading-none tracking-[-0.03em] text-accent">
              {c.m1v}
            </div>
            <h3 className="text-[16px] font-semibold leading-[1.3]">{c.headline}</h3>
            <span className="text-[13px] text-ink-50">{c.client}</span>
            <div className="mt-auto pt-2">
              <CardActions
                kind="case-card"
                caseSlug={c.slug}
                readLabel="Read the story ›"
                ariaLabel={`Read the story: ${c.client}`}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-7 text-[13.5px] text-ink-50">{site.sections.cases.footnote}</p>
    </section>
  );
}
