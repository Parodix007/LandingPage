"use client";

import type { CaseStudy, Tone } from "@/content/types";
import { Watermark } from "@/components/ui/Watermark";
import { Chip } from "@/components/ui/Chip";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useModal } from "@/components/providers/ModalProvider";
import { useCarousel } from "./useCarousel";

export type HeroCaseSliderProps = {
  cases: CaseStudy[];
  label: string;
  readCaseLabel: string;
};

// Mirrors CaseStudies.tsx's/work/page.tsx's tone lookup (ui/ is frozen, so this small table is
// duplicated locally rather than shared — same precedent those files' own comments document).
const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

// Mirrors ProcessCarousel.tsx's/ServicesSlider.tsx's ARROW_BASE exactly (SPEC §6.6 / CLAUDE.md
// carousel pattern) — also the same treatment the previous mockup-based hero slider used.
const ARROW_BASE =
  "hit-44 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-colors duration-[250ms] hover:border-accent hover:bg-white/[0.05]";

// Dots show the case's TAG (not `c.client`, not an index) so the visible label is contained in
// the accessible name `Przejdź do: ${c.tag}` — WCAG 2.5.3 Label in Name, same reasoning
// ProcessCarousel/ServicesSlider document for their own dot rows. `client` is too long (some run
// 400+px as a pill) and wraps the dot row onto multiple lines, inflating the hero's height —
// `tag` is short and, for the three featured cases, mutually distinct.
const DOT_BASE =
  "hit-44 rounded-[var(--radius-pill)] border px-4 py-[9px] font-mono text-[13px] font-medium leading-none transition-colors duration-[250ms]";
const DOT_ACTIVE =
  "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-white";
const DOT_INACTIVE = "border-white/[0.16] text-ink-55";

// Client leaf (CLAUDE.md client/server boundary) — the hero's right column carousel, now over
// the featured case studies instead of mockups (see Hero.tsx). Carousel skeleton mirrors
// ServicesSlider.tsx/ProcessCarousel.tsx exactly (step logic lives entirely in the pure
// `useCarousel` hook; always-rendered arrows with aria-disabled + opacity-[0.35] at bounds,
// inline-transform track, text dot row) — no aria-live, no touch handlers, no matchMedia
// (reduced motion is handled globally in CSS).
//
// 2026-07-31 service-pages-restructure design: replaces the previous mockup-based hero slider,
// which rendered a `Demo` shape (screenshot, feature pills, live-mockup CTA) that `CaseStudy`
// simply does not have — case studies now fill the hero instead, fed by
// `site.featuredCaseSlugs` (resolved in Hero.tsx). Unlike that retired component, which
// deliberately opened nothing, this tile's CTA opens the case modal via `openCaseModal(slug)` —
// available because Hero already sits inside `ModalProvider` on src/app/page.tsx. A case study
// has a natural detail view (the same modal the #cases section and /work/ already use) and the
// modal already exists, so there's no reason to build a second one here.
//
// Heading-order note: the tile's headline (`c.headline`) is rendered as a bold <p>, NOT a
// heading — same reasoning the previous mockup-based slider documented for its own tagline: the
// hero's h1 is the page's only h1, and a hero → h3 jump was the site's one failing Lighthouse
// a11y audit (heading-order). A bold, appropriately-sized paragraph reproduces the visual weight
// of a heading without adding one to the document outline.
export function HeroCaseSlider({ cases, label, readCaseLabel }: HeroCaseSliderProps) {
  const { step, next, prev, goTo } = useCarousel(cases.length, 0);
  const { openCaseModal } = useModal();
  const last = cases.length - 1;

  return (
    <div
      aria-roledescription="carousel"
      aria-label={label}
      className="relative w-full justify-self-center"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Poprzednia realizacja"
            aria-disabled={step === 0}
            onClick={prev}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === 0 ? "opacity-[0.35]" : ""}`}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Następna realizacja"
            aria-disabled={step === last}
            onClick={next}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === last ? "opacity-[0.35]" : ""}`}
          >
            <ChevronRightIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden">
        <div
          data-testid="hero-case-track"
          className="flex gap-[18px]"
          style={{
            transform: `translateX(calc(${step} * (-100% - 18px)))`,
            transition: "transform 0.65s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {cases.map((c, i) => {
            const active = i === step;
            return (
              <div
                key={c.slug}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} z ${cases.length}`}
                aria-hidden={active ? undefined : true}
                className="card-host relative flex flex-[0_0_100%] flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] border border-border-10 bg-surface p-8"
              >
                {/* Decorative glow + watermark — purely presentational, hidden from AT. */}
                <span
                  aria-hidden="true"
                  className="card-glow -right-[120px] -top-[120px] h-[340px] w-[340px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
                />
                <span className="absolute right-[26px] top-6">
                  <Watermark />
                </span>

                <div className="relative flex flex-wrap items-center gap-2.5">
                  <Chip tone={TONE_CHIP[c.tone]}>{c.tag}</Chip>
                </div>

                <div className="flex flex-wrap gap-9">
                  <div className="flex flex-col gap-1">
                    <p className="text-[clamp(30px,3.6vw,40px)] font-bold leading-none tracking-[-0.03em] text-accent">
                      {c.m1v}
                    </p>
                    <p className="text-[13.5px] text-ink-55">{c.m1l}</p>
                  </div>
                  {c.m2v && c.m2l ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[clamp(30px,3.6vw,40px)] font-bold leading-none tracking-[-0.03em] text-white">
                        {c.m2v}
                      </p>
                      <p className="text-[13.5px] text-ink-55">{c.m2l}</p>
                    </div>
                  ) : null}
                </div>

                <p className="max-w-[860px] text-[clamp(22px,2.6vw,30px)] font-bold leading-[1.12] tracking-[-0.02em]">
                  {c.headline}
                </p>

                <p className="text-[13px] text-ink-50">{c.client}</p>

                <p className="relative text-[15px] leading-[1.6] text-ink-70">{c.teaser}</p>

                {/* Footer — the only interactive element left per tile is the "read the story"
                    trigger, so it's also the only one needing roving tabIndex (inactive slides
                    are both aria-hidden and keyboard-inert). Styled like the previous mockup
                    slider's live-demo CTA (filled accent pill). */}
                <div className="mt-auto pt-[22px]">
                  <button
                    type="button"
                    tabIndex={active ? undefined : -1}
                    onClick={() => openCaseModal(c.slug)}
                    className={`hit-44 ${PILL_FOCUS} inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 py-3 text-[15px] font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]`}
                  >
                    {readCaseLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {cases.map((c, i) => {
          const active = i === step;
          return (
            <button
              key={c.slug}
              type="button"
              aria-label={`Przejdź do: ${c.tag}`}
              aria-current={active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`${DOT_BASE} ${PILL_FOCUS} ${active ? DOT_ACTIVE : DOT_INACTIVE}`}
            >
              {c.tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
