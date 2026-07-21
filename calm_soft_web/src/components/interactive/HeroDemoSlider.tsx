"use client";

import type { Demo } from "@/content/types";
import { Watermark } from "@/components/ui/Watermark";
import { Chip } from "@/components/ui/Chip";
import { WarningNote } from "@/components/ui/WarningNote";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useModal } from "@/components/providers/ModalProvider";
import { useCarousel } from "./useCarousel";

export type HeroDemoSliderProps = {
  demos: Demo[];
  label: string;
  openLabel: string;
  langChip: string;
  detailLabel: string;
  desktopNote: string;
};

// Mirrors ProcessCarousel.tsx's ARROW_BASE exactly (SPEC §6.6 / CLAUDE.md carousel pattern).
const ARROW_BASE =
  "hit-44 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-colors duration-[250ms] hover:border-accent hover:bg-white/[0.05]";

// Dots show the demo NAME (not an index) so the visible label is contained in the accessible
// name `Go to ${d.name}` — WCAG 2.5.3 Label in Name, same reasoning ProcessCarousel documents
// for its "00".."03" step-number dots.
const DOT_BASE =
  "hit-44 rounded-[var(--radius-pill)] border px-4 py-[9px] font-mono text-[13px] font-medium leading-none transition-colors duration-[250ms]";
const DOT_ACTIVE =
  "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-white";
const DOT_INACTIVE = "border-white/[0.16] text-ink-55";

const OPEN_LINK =
  "hit-44 inline-flex w-fit items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-4 py-2 text-[14.5px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] hover:border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] hover:text-white";

// Client leaf (SPEC §16 client/server boundary) — replaces the retired decorative code window
// in the hero's right column (see Hero.tsx) with a functional carousel over the three live
// demos. Step logic lives entirely in the pure `useCarousel` hook; this component owns only
// markup + wiring, mirroring ProcessCarousel.tsx's pattern (carousel root, always-rendered
// arrows with aria-disabled + opacity-[0.35] at bounds, inline-transform track, dot row).
//
// One a11y detail ProcessCarousel doesn't need: its slides hold no interactive content — here,
// the active slide is whole-tile-clickable to the detail modal (stretched "View details",
// mirroring the section/subpage cards), with "Open the demo" kept as a raised sibling link so
// the live mockup stays one click away. Off-screen slides must be keyboard-inert — both the
// "View details" button and the "Open the demo" link get tabIndex={-1} on inactive slides, in
// addition to the slide's aria-hidden.
export function HeroDemoSlider({
  demos,
  label,
  openLabel,
  langChip,
  detailLabel,
  desktopNote,
}: HeroDemoSliderProps) {
  const { step, next, prev, goTo } = useCarousel(demos.length, 0);
  const { openDemoModal } = useModal();
  const last = demos.length - 1;

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
            aria-label="Previous demo"
            aria-disabled={step === 0}
            onClick={prev}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === 0 ? "opacity-[0.35]" : ""}`}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Next demo"
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
          data-testid="hero-demo-track"
          className="flex gap-[18px]"
          style={{
            transform: `translateX(calc(${step} * (-100% - 18px)))`,
            transition: "transform 0.65s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {demos.map((d, i) => {
            const active = i === step;
            return (
              <div
                key={d.slug}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${demos.length}`}
                aria-hidden={active ? undefined : true}
                className="card-host relative flex min-h-[360px] flex-[0_0_100%] flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] border border-border-10 bg-surface p-8"
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
                  <Chip tone="accent">{d.tag}</Chip>
                </div>
                <h3 className="relative m-0 text-[26px] font-bold leading-[1.2] tracking-[-0.02em]">
                  {d.name}
                </h3>
                <p className="relative max-w-[440px] text-[15px] leading-[1.6] text-ink-70">
                  {d.description}
                </p>

                {/* Whole-tile click = View details (stretched over the slide, mirrors the
                    section/subpage cards). "Open the demo" is a raised sibling so the live mockup
                    stays one click away. Both go tabIndex=-1 on inactive slides (off-screen +
                    aria-hidden). This actions row is a STATIC direct child of the slide, so
                    .pill-stretched::after anchors to the slide (card-host), not a nested
                    positioned wrapper. */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                  <button
                    type="button"
                    aria-label={`View ${d.name} details`}
                    tabIndex={active ? undefined : -1}
                    onClick={() => openDemoModal(d.slug)}
                    className={`pill-stretched w-fit rounded-[var(--radius-pill)] ${PILL_FOCUS}`}
                  >
                    <span className="relative z-[1] inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-[color-mix(in_oklch,var(--color-accent)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_14%,transparent)] px-4 py-2 text-[14.5px] font-medium leading-none text-accent transition-[all] duration-[250ms] hover:bg-[color-mix(in_oklch,var(--color-accent)_24%,transparent)] hover:text-white">
                      {detailLabel}
                    </span>
                  </button>
                  <span className="relative z-10">
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open the demo: ${d.name}`}
                      tabIndex={active ? undefined : -1}
                      className={`${OPEN_LINK} ${PILL_FOCUS}`}
                    >
                      {openLabel}
                    </a>
                  </span>
                </div>
                {/* Desktop-only staff panels (HealthLab, Merdi Panel) get a second line, styled
                    as a warning, stacked under the language chip — see docs/superpowers/specs/
                    2026-07-21-desktop-only-demo-note-design.md ("Warning treatment" revision).
                    WarningNote sets its own text-warn colour directly on its <p>, so the
                    wrapper's muted text-ink-50 (kept for the langChip span) never wins the
                    cascade for it. */}
                <div className="relative z-10 flex flex-col gap-1 text-[13px] text-ink-50">
                  <span>{langChip}</span>
                  {d.desktopOnly && <WarningNote>{desktopNote}</WarningNote>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {demos.map((d, i) => {
          const active = i === step;
          return (
            <button
              key={d.slug}
              type="button"
              aria-label={`Go to ${d.name}`}
              aria-current={active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`${DOT_BASE} ${PILL_FOCUS} ${active ? DOT_ACTIVE : DOT_INACTIVE}`}
            >
              {d.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
