import { getDemoBySlug } from "@/content/demos";
import { getServiceForLine } from "@/content/services";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { WarningNote } from "@/components/ui/WarningNote";
import { GhostPill } from "@/components/ui/GhostPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { DemoLogo } from "@/components/ui/DemoLogo";
import { RichText } from "@/components/ui/RichText";
import { CardActions } from "@/components/interactive/CardActions";
import type { Demo, SolutionDemoItem, SolutionLine } from "@/content/types";

export type SolutionLineBlockProps = {
  line: SolutionLine;
  clickLabel: string;
  audienceLabel: string;
  serviceLabel: string;
  asIsLabel: string;
  customLabel: string;
};

// Shared "chip" treatment for the per-demo language note (2026-07-22 pl-copy handoff §6) —
// mirrors Demos.tsx's / DemoModalContent's / the old demos/page.tsx's local constant (ui/ is
// frozen, so no new shared primitive — this is the fourth copy of the same convention).
const LANG_CHIP_CLASS =
  "inline-flex items-center rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70";

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Server component (SPEC §16 client/server boundary) — no 'use client'. One instance per
// SolutionLine, rendered by the two solution groups on /demos/ (2026-07-26 solutions restructure
// design). Demo cards are the old flat /demos/ grid's card markup, transplanted 1:1 (same
// precedent as work/page.tsx duplicating CaseStudies.tsx's case-card markup) with four
// differences: description text comes from `item.text`, the external-link
// label comes from `item.openCta` — per demo, so it can name what the demo actually opens
// ("Otwórz panel zespołu ›"); the old shared sections.demos.cta was retired with this change
// once nothing read it any more. The card title is an
// <h4> (it now nests under the line's own <h3>), and DemoLogo gets instanceId="line" so its
// namespaced mask id never collides with the homepage tile / hero slider / modal instances.
//
// CRITICAL — stretched-button anchoring (SPEC §6.4): CardActions renders a `.pill-stretched`
// whose `::after { inset: 0 }` anchors to the NEAREST positioned ancestor, which must be this
// specific card's own `.card-host`. That's why the <article> line wrapper and the demo grid
// below are never `relative`/`absolute` — only each individual `.card-host` div carries
// `relative`, and its footer row (holding CardActions) never does. If either outer container
// picked up a position, a bug in one card's own positioning would let that card's stretched pill
// balloon out to cover the whole line (or the whole grid) instead of just its own tile.
export function SolutionLineBlock({
  line,
  clickLabel,
  audienceLabel,
  serviceLabel,
  asIsLabel,
  customLabel,
}: SolutionLineBlockProps) {
  const items = line.items
    .map((item) => ({ item, demo: getDemoBySlug(item.demoSlug) }))
    .filter((x): x is { item: SolutionDemoItem; demo: Demo } => x.demo !== undefined);
  const service = getServiceForLine(line.slug);

  return (
    <article
      id={line.slug}
      aria-labelledby={`linia-${line.slug}`}
      className="scroll-mt-[88px] flex flex-col gap-5"
    >
      <div>
        <Chip tone="accent">{line.kicker}</Chip>
      </div>

      <h3
        id={`linia-${line.slug}`}
        className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]"
      >
        {line.headline}
      </h3>

      {line.intro.map((paragraph) => (
        <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
          <RichText>{paragraph}</RichText>
        </p>
      ))}

      <div className="flex flex-col gap-2 border-l-2 border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] pl-5">
        <p className="text-[16px] leading-[1.6] text-ink-70">
          <strong className="text-ink">{audienceLabel}</strong> <RichText>{line.audience}</RichText>
        </p>

        {service && (
          <p className="text-[16px] leading-[1.6] text-ink-70">
            <strong className="text-ink">{serviceLabel}</strong>{" "}
            <a
              href={`/?usluga=${service.id}#services`}
              className={`text-accent underline decoration-1 underline-offset-2 hover:text-white ${PILL_FOCUS}`}
            >
              {service.tag}
            </a>
          </p>
        )}
      </div>

      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
        {clickLabel}
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
        {items.map(({ item, demo: d }) => (
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
              {/* Decorative glow + mono watermark — purely presentational, hidden from AT. */}
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
              <h4 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">
                {d.logoId ? (
                  <DemoLogo logo={d.logoId} instanceId="line" className="h-7 w-auto" />
                ) : (
                  d.name
                )}
              </h4>
              <p className="text-[14.5px] leading-[1.55] text-ink-70">
                <RichText>{item.text}</RichText>
              </p>
              {/* Desktop-only staff panels get a warning caveat before the external "Open the
                  demo" link — see docs/superpowers/specs/2026-07-21-desktop-only-demo-note-
                  design.md ("Warning treatment" revision). */}
              {d.desktopOnly && <WarningNote>{site.sections.demos.desktopNote}</WarningNote>}
            </div>

            {/* Whole-card click = View details (stretched via CardActions). The external "Open
                the demo" link is a sibling raised above the stretched hit-area (relative z-10) —
                same sibling-CTA pattern as the case card / the old demos/page.tsx card. This
                footer row must NOT carry `relative` (see file header note). */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-7 pb-7 pt-4">
              <CardActions
                kind="demo-card"
                demoSlug={d.slug}
                readLabel={site.sections.demos.detailCta}
                ariaLabel={`${site.sections.demos.detailCta} ${d.name}`}
              />
              <span className="relative z-10">
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.openCta} ${d.name}`}
                  className={`inline-flex w-fit rounded-[var(--radius-pill)] ${PILL_FOCUS}`}
                >
                  <span className="relative z-[1] inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-4 py-2 text-[14.5px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:text-white">
                    {item.openCta}
                  </span>
                </a>
              </span>
            </div>
          </div>
        ))}
      </div>

      {line.caveat && (
        <aside className="rounded-[var(--radius-card)] border border-border-10 bg-white/[0.03] p-5">
          <strong className="text-ink">{line.caveat.label}</strong>
          <p className="mt-2 text-[15px] leading-[1.55] text-ink-70">{line.caveat.body}</p>
        </aside>
      )}

      {line.proof && (
        <div>
          <strong className="text-ink">{line.proof.label}</strong>
          <p className="mt-2 text-[15px] leading-[1.55] text-ink-70">{line.proof.body}</p>
          <div className="mt-3">
            <GhostPill tone="accent" size="sm" as="a" href="/work/">
              {line.proof.cta}
            </GhostPill>
          </div>
        </div>
      )}

      {/* line.price is undefined for every line today (owner hasn't set amounts yet) — this
          block intentionally renders nothing until content supplies it. Do not invent figures. */}
      {line.price && (
        <div className="flex flex-col gap-1 text-[15px] leading-[1.55] text-ink-70">
          <p>
            <strong className="text-ink">{asIsLabel}</strong> {line.price.asIs}
          </p>
          <p>
            <strong className="text-ink">{customLabel}</strong> {line.price.custom}
          </p>
        </div>
      )}
    </article>
  );
}
