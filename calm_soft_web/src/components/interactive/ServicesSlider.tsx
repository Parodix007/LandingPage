"use client";

import { useEffect } from "react";
import type { Service, Tone } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useModal } from "@/components/providers/ModalProvider";
import { useInquiry } from "@/components/providers/InquiryProvider";
import { getCaseBySlug } from "@/content/cases";
import { getSolutionLineBySlug } from "@/content/solutions";
import { useCarousel } from "./useCarousel";

export type ServicesSliderProps = {
  services: Service[];
  label: string;
  overviewLabel: string;
  fitLabel: string;
  deliverLabel: string;
  approachLabel: string;
  proofLabel: string;
  readCaseLabel: string;
  ctaLabel: string;
  note: string;
  solutionsLabel: string;
};

// HANDOFF §3, tones reassigned by the 2026-07-26 services-solutions crosslink reorder (spec §5):
// card 1 core (tone "b") and card 4 refactor (tone "a") keep their original glow/hover accent;
// card 2 automation now carries tone "a" and card 3 web now carries tone "b" — a straight swap
// that restores the alternating b/a/b/a rhythm the reorder would otherwise have broken.
const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

const TONE_GLOW: Record<Tone, string> = {
  a: "[--glow-color:color-mix(in_oklch,var(--color-accent)_18%,transparent)]",
  b: "[--glow-color:color-mix(in_oklch,var(--color-accent2)_18%,transparent)]",
};

const TONE_HOVER_BORDER: Record<Tone, string> = {
  a: "hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]",
  b: "hover:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)]",
};

// Transplanted verbatim from the retired ServiceModalContent.tsx — HANDOFF §4 grid 1 ("when
// it's the right call" / "what we deliver") and grid 2 ("how we run it" / "proof from our
// work") share the same auto-fit column layout.
const GRID_COLS =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-[clamp(18px,2.5vw,34px)]";
const SECTION_LABEL = "text-[13px] font-semibold uppercase tracking-[0.12em] text-accent";

// Mirrors ProcessCarousel.tsx's/HeroDemoSlider.tsx's ARROW_BASE exactly (SPEC §6.6 / CLAUDE.md
// carousel pattern).
const ARROW_BASE =
  "hit-44 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-colors duration-[250ms] hover:border-accent hover:bg-white/[0.05]";

// Dots show the service TAG (not an index) so the visible label is contained in the accessible
// name `Przejdź do: ${s.tag}` — WCAG 2.5.3 Label in Name, same reasoning HeroDemoSlider/
// ProcessCarousel document for their own dot rows.
const DOT_BASE =
  "hit-44 rounded-[var(--radius-pill)] border px-4 py-[9px] font-mono text-[13px] font-medium leading-none transition-colors duration-[250ms]";
const DOT_ACTIVE =
  "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-white";
const DOT_INACTIVE = "border-white/[0.16] text-ink-55";

// Client leaf (SPEC §16 client/server boundary) — replaces the retired 2×2 service-card grid +
// service modal with a one-tile-per-view slider (docs/superpowers/specs/2026-07-22-services-
// slider-design.md). Carousel skeleton mirrors HeroDemoSlider.tsx/ProcessCarousel.tsx (step
// logic lives entirely in the pure `useCarousel` hook; always-rendered arrows with
// aria-disabled + opacity-[0.35] at bounds, inline-transform track, tag-text dot row) — no
// aria-live, no touch handlers, no matchMedia (reduced motion is handled globally in CSS).
//
// Each tile renders EXACTLY the content of the retired service detail modal (overview chip,
// headline, intro, fit/deliver/approach/proof grids, related-case mini-cards) — see
// ServiceModalContent.tsx's git history for the pre-slider markup this was transplanted from.
// The tile is an h3 (not h2 — SectionHeading's h2 in Services.tsx stays the page's only H2 for
// this section) and carries no id="modal-headline" (there is no modal to label anymore). The
// related-case mini-card's "Read the story" trigger is a hand-rolled stretched button rather
// than GhostPill (GhostPill's PillElement doesn't forward tabIndex, and roving tabIndex on
// off-screen slides is required here) — the mini-card keeps `card-host relative` so
// .pill-stretched::after anchors to the mini-card, not the tile. The tile footer CTA mirrors
// CardActions' retired service-card "start" behavior exactly (requestContactScroll then a rAF
// focusContactField — never ctaClose, since a slider tile isn't a modal).
export function ServicesSlider({
  services,
  label,
  overviewLabel,
  fitLabel,
  deliverLabel,
  approachLabel,
  proofLabel,
  readCaseLabel,
  ctaLabel,
  note,
  solutionsLabel,
}: ServicesSliderProps) {
  const { step, next, prev, goTo } = useCarousel(services.length, 0);
  const { openCaseModal } = useModal();
  const { requestContactScroll, focusContactField } = useInquiry();
  const last = services.length - 1;

  // Deep-link from a solution line's "To część usługi" back-link (2026-07-26 services-solutions
  // crosslink design, spec §3): /?usluga=<id>#services opens the matching slide. Reads the query
  // param in an effect (never during render) so the server-prerendered markup — always slide 0 —
  // never disagrees with the client's first render. No parameter or no matching id is a no-op;
  // `useCarousel` itself is untouched.
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("usluga");
    if (!value) return;
    const index = services.findIndex((s) => s.id === value);
    if (index >= 0) goTo(index);
  }, [services, goTo]);

  const startProject = () => {
    requestContactScroll();
    requestAnimationFrame(() => focusContactField());
  };

  return (
    <div aria-roledescription="carousel" aria-label={label} className="relative w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Poprzednia usługa"
            aria-disabled={step === 0}
            onClick={prev}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === 0 ? "opacity-[0.35]" : ""}`}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Następna usługa"
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
          data-testid="services-track"
          className="flex gap-[18px]"
          style={{
            transform: `translateX(calc(${step} * (-100% - 18px)))`,
            transition: "transform 0.65s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {services.map((s, i) => {
            const active = i === step;
            const relatedCases = s.relatedSlugs
              .map((slug) => getCaseBySlug(slug))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));
            const relatedLines = s.solutionSlugs
              .map((slug) => getSolutionLineBySlug(slug))
              .filter((l): l is NonNullable<typeof l> => Boolean(l));

            return (
              <div
                key={s.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} z ${services.length}`}
                aria-hidden={active ? undefined : true}
                className={`card-host relative flex flex-[0_0_100%] flex-col gap-[clamp(14px,2.4vh,22px)] overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[36px_30px] min-[900px]:p-10 transition-[border-color] duration-[350ms] ${TONE_HOVER_BORDER[s.tone]}`}
              >
                {/* Decorative glow circle — purely presentational, hidden from AT. */}
                <span
                  aria-hidden="true"
                  className={`card-glow -right-[120px] -top-[120px] h-[340px] w-[340px] ${TONE_GLOW[s.tone]}`}
                />
                <span aria-hidden="true" className="absolute right-[26px] top-6">
                  <Watermark />
                </span>

                <div className="relative flex flex-wrap items-center gap-[10px]">
                  <Chip tone={TONE_CHIP[s.tone]}>{s.tag}</Chip>
                  <span className="text-[13px] text-ink-50">{overviewLabel}</span>
                </div>

                <h3 className="max-w-[860px] text-[clamp(22px,2.6vw,30px)] font-bold leading-[1.12] tracking-[-0.02em]">
                  {s.headline}
                </h3>

                <p className="max-w-[860px] text-[15px] leading-[1.55] text-ink-70">{s.intro}</p>

                <div className={GRID_COLS}>
                  <div className="flex flex-col gap-3">
                    <p className={SECTION_LABEL}>{fitLabel}</p>
                    <ul className="flex flex-col gap-[9px]">
                      {s.fit.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span aria-hidden="true" className="text-[14px] leading-[1.5] text-accent">
                            ✓
                          </span>
                          <span className="text-[14px] leading-[1.5] text-ink-70">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-[14px]">
                    <p className={SECTION_LABEL}>{deliverLabel}</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-[12px_20px]">
                      {s.deliver.map((d) => (
                        <div key={d.n} className="flex flex-col gap-[3px]">
                          <p className="text-[14.5px] font-semibold text-ink">{d.n}</p>
                          <p className="text-[13px] leading-[1.45] text-ink-60">{d.d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={GRID_COLS}>
                  <div className="flex flex-col gap-2">
                    <p className={SECTION_LABEL}>{approachLabel}</p>
                    <p className="text-[14px] leading-[1.55] text-ink-70">{s.approach}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className={SECTION_LABEL}>{proofLabel}</p>
                    <div className="flex flex-wrap gap-3">
                      {relatedCases.map((c) => (
                        <div
                          key={c.slug}
                          className="card-host relative flex flex-[1_1_240px] flex-col gap-[6px] rounded-[var(--radius-mini)] border border-border-10 bg-white/[0.04] p-[18px_20px] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)]"
                        >
                          <p className="text-[26px] font-bold leading-none tracking-[-0.03em] text-accent">
                            {c.m1v}
                          </p>
                          <p className="text-[14px] font-semibold leading-[1.35] text-ink">{c.headline}</p>
                          <button
                            type="button"
                            aria-label={`Przeczytaj historię: ${c.client}`}
                            tabIndex={active ? undefined : -1}
                            onClick={() => openCaseModal(c.slug)}
                            className={`pill-stretched w-fit rounded-[var(--radius-pill)] ${PILL_FOCUS}`}
                          >
                            <span className="relative z-[1] inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-[14px] py-[6px] text-[13px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:text-white">
                              {readCaseLabel}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {relatedLines.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className={SECTION_LABEL}>{solutionsLabel}</p>
                    <div className="flex flex-wrap gap-3">
                      {relatedLines.map((line) => (
                        <a
                          key={line.slug}
                          href={`/demos/#${line.slug}`}
                          tabIndex={active ? undefined : -1}
                          className={`inline-flex w-fit rounded-[var(--radius-pill)] ${PILL_FOCUS}`}
                        >
                          <span className="relative z-[1] inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-4 py-2 text-[14.5px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:text-white">
                            {line.kicker}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[22px]">
                  <button
                    type="button"
                    tabIndex={active ? undefined : -1}
                    onClick={startProject}
                    className={`hit-44 ${PILL_FOCUS} inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 py-3 text-[15px] font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]`}
                  >
                    {ctaLabel}
                  </button>
                  <span className="text-[12.5px] text-ink-50">{note}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {services.map((s, i) => {
          const active = i === step;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Przejdź do: ${s.tag}`}
              aria-current={active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`${DOT_BASE} ${PILL_FOCUS} ${active ? DOT_ACTIVE : DOT_INACTIVE}`}
            >
              {s.tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
