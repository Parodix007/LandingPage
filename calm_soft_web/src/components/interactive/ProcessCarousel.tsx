"use client";

import type { ProcessStep } from "@/content/types";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Watermark } from "@/components/ui/Watermark";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useCarousel } from "./useCarousel";

export type ProcessCarouselProps = {
  steps: ProcessStep[];
};

// HANDOFF §5 / SPEC §6.6 — 44px circular arrows; opacity 0.35 at bounds but always rendered
// and clickable (useCarousel clamps, so a bound click is a no-op, never `disabled`/tab-skip).
const ARROW_BASE =
  "hit-44 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-colors duration-[250ms] hover:border-accent hover:bg-white/[0.05]";

// Mono pill dots — labels use the visible step.number ("00".."04") so the accessible name
// contains the on-screen text (WCAG 2.5.3 Label in Name, Level A: a voice-control user saying
// the number can activate it). goTo still keys off the raw 0-based index, which equals the
// number, so "Go to step 03" jumps to the 4th/last slide.
const DOT_BASE =
  "hit-44 rounded-[var(--radius-pill)] border px-4 py-[9px] font-mono text-[13px] font-medium leading-none transition-colors duration-[250ms]";
const DOT_ACTIVE =
  "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-white";
const DOT_INACTIVE = "border-white/[0.16] text-ink-55";

// Client leaf (SPEC §16 client/server boundary) — step logic lives entirely in the pure,
// unit-tested `useCarousel` hook; this component owns only markup + wiring. Track transform
// is an inline style computed from `step`, assertable in jsdom via `style.transform`.
export function ProcessCarousel({ steps }: ProcessCarouselProps) {
  // Default to "00 Rozmowa" — the free intro call is the entry point of the process
  // (2026-07-22 pl-copy handoff: "ProcessCarousel: domyślny krok = 00").
  const { step, next, prev, goTo } = useCarousel(steps.length, 0);
  const last = steps.length - 1;
  const { line1, line2 } = site.sections.process;

  return (
    <div aria-roledescription="carousel">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <SectionHeading id="process-heading" line1={line1} line2={line2} />
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Poprzedni krok"
            aria-disabled={step === 0}
            onClick={prev}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === 0 ? "opacity-[0.35]" : ""}`}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Następny krok"
            aria-disabled={step === last}
            onClick={next}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === last ? "opacity-[0.35]" : ""}`}
          >
            <ChevronRightIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="mt-12 overflow-hidden">
        <div
          data-testid="process-track"
          className="flex gap-[18px]"
          style={{
            transform: `translateX(calc(${step} * (-100% - 18px)))`,
            transition: "transform 0.65s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.number}
              role="group"
              aria-roledescription="slide"
              aria-label={`Krok ${i + 1} z ${steps.length}`}
              aria-hidden={i === step ? undefined : true}
              className="card-host relative grid min-h-[320px] flex-[0_0_100%] grid-cols-1 gap-8 overflow-hidden rounded-[var(--radius-card)] bg-surface p-8 min-[900px]:grid-cols-[0.9fr_1.1fr] min-[900px]:gap-14 min-[900px]:p-16"
            >
              {/* Decorative glow + watermark — purely presentational, hidden from AT. */}
              <span
                aria-hidden="true"
                className="card-glow -right-[160px] -top-[160px] h-[460px] w-[460px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
              />
              <span className="absolute right-[34px] top-[28px]">
                <Watermark />
              </span>

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[18px] text-accent">{s.number}</span>
                  {s.badge ? (
                    <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-[color-mix(in_oklch,var(--color-accent2)_32%,transparent)] bg-[color-mix(in_oklch,var(--color-accent2)_15%,transparent)] px-4 py-1 text-[13.5px] leading-none text-ink">
                      {s.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="m-0 text-[clamp(34px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.02em]">
                  {s.title}
                </h3>
              </div>

              <div className="relative">
                <p className="max-w-[560px] text-[18px] leading-[1.6] text-ink-70">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {steps.map((s, i) => {
          const active = i === step;
          return (
            <button
              key={s.number}
              type="button"
              aria-label={`Przejdź do kroku ${s.number}`}
              aria-current={active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`${DOT_BASE} ${PILL_FOCUS} ${active ? DOT_ACTIVE : DOT_INACTIVE}`}
            >
              {s.number}
            </button>
          );
        })}
      </div>
    </div>
  );
}
