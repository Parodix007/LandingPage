import { getDemoBySlug } from "@/content/demos";
import { allSolutionLines, solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Watermark } from "@/components/ui/Watermark";
import { GhostPill } from "@/components/ui/GhostPill";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import type { Demo, SolutionLine } from "@/content/types";

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Server component (SPEC §16 client/server boundary) — static content only, no interactive
// leaf besides the frozen CalendlyCta in the footer row.
//
// 2026-07-26 solutions restructure: replaces the old 3-demo-card Demos section with the five
// product lines from `solutions.ts` (allSolutionLines — 2 groups: operacyjne has three lines,
// branżowe has two, flattened, display order already baked in there: operacyjne before
// branżowe, integracje → automatyzacje → migracje → weterynaria → kliniki-laboratoria). Each
// tile shows its line's *lead* demo screenshot (leadDemoSlug, resolved via getDemoBySlug —
// never by index) and links to that line's anchor on /demos/, where the full breakdown (all
// demos, audience, caveats, proof) lives. This section keeps the
// `id="demo"`/`aria-labelledby="demo-heading"` anchor contract (nav, footer, hero all link
// here; scroll-margin-top lives in globals.css) even though the content is no longer "demos"
// but "solutions" — renaming the anchor would be a second, unrelated migration.
//
// Card footer is a SINGLE stretched GhostPill (whole-card click) — no CardActions/modal split
// like the old Demos card, since there's nothing to open in a modal here, just one destination.
// The footer wrapper must NOT carry `relative`: `.pill-stretched::after` (inset: 0) anchors to
// the nearest positioned ancestor, which has to stay `.card-host`, or the clickable area
// shrinks to the footer strip instead of covering the whole tile.
export function Solutions() {
  const tiles = allSolutionLines
    .map((line) => ({ line, lead: getDemoBySlug(line.leadDemoSlug) }))
    .filter((x): x is { line: SolutionLine; lead: Demo } => x.lead !== undefined);

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading
        id="demo-heading"
        line1={solutions.home.line1}
        line2={solutions.home.line2}
        subline={solutions.home.lead}
      />

      <div className="mt-12 grid grid-cols-1 gap-6 min-[700px]:grid-cols-2">
        {tiles.map(({ line, lead }) => (
          <div
            key={line.slug}
            className={`card-host relative flex flex-col overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface ${HOVER_LIFT}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image */}
            <img
              src={lead.shot}
              alt={lead.shotAlt}
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

              <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">
                {line.homeTitle}
              </h3>
              <p className="text-[14.5px] leading-[1.55] text-ink-70">{line.homeTeaser}</p>
            </div>

            {/* Whole-tile click via the stretched GhostPill — one interactive element per card
                (no nested interactives). No `relative` here: see file header note. */}
            <div className="flex px-7 pb-7 pt-4">
              <GhostPill
                tone="accent"
                stretched
                as="a"
                href={`/demos/#${line.slug}`}
                aria-label={`${line.homeTitle} — ${solutions.home.tileCta}`}
              >
                {solutions.home.tileCta}
              </GhostPill>
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
