"use client";

import type { Demo } from "@/content/types";
import { Watermark } from "@/components/ui/Watermark";
import { Chip } from "@/components/ui/Chip";
import { WarningNote } from "@/components/ui/WarningNote";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { DemoLogo } from "@/components/ui/DemoLogo";
import { TechStack } from "@/components/ui/TechStack";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useCarousel } from "./useCarousel";

export type HeroDemoSliderProps = {
  demos: Demo[];
  label: string;
  // Label text for the per-demo "interface is in English" chip (site.sections.demos.langChip)
  // — rendered per-slide, only for demos whose own `uiLang === "en"` (2026-07-22 pl-copy
  // handoff §6), not unconditionally for every slide.
  langChip: string;
  flowsLabel: string;
  techLegend: string;
  liveCta: string;
  demoNote: string;
  desktopNote: string;
};

// Shared "chip" treatment for the per-demo language note — mirrors Demos.tsx's /
// DemoModalContent's local constant (ui/ is frozen, so no new shared primitive).
const LANG_CHIP_CLASS =
  "inline-flex items-center rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70";

// Mirrors ProcessCarousel.tsx's/ServicesSlider.tsx's ARROW_BASE exactly (SPEC §6.6 / CLAUDE.md
// carousel pattern).
const ARROW_BASE =
  "hit-44 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-20 text-ink transition-colors duration-[250ms] hover:border-accent hover:bg-white/[0.05]";

// Dots show the demo NAME (not an index) so the visible label is contained in the accessible
// name `Przejdź do: ${d.name}` — WCAG 2.5.3 Label in Name, same reasoning ProcessCarousel/
// ServicesSlider document for their own dot rows.
const DOT_BASE =
  "hit-44 rounded-[var(--radius-pill)] border px-4 py-[9px] font-mono text-[13px] font-medium leading-none transition-colors duration-[250ms]";
const DOT_ACTIVE =
  "border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-white";
const DOT_INACTIVE = "border-white/[0.16] text-ink-55";

// Section-label treatment for the "Kluczowe przepływy"/techLegend sub-headings — mirrors
// ServicesSlider.tsx's SECTION_LABEL constant (transplanted verbatim from DemoModalContent,
// which inlines the same classes rather than naming a constant — ui/ is frozen, so no shared
// primitive either way).
const SECTION_LABEL = "text-[13px] font-semibold uppercase tracking-[0.12em] text-accent";

// Client leaf (SPEC §16 client/server boundary) — the hero's right column carousel over the
// three featured demos (see Hero.tsx). Carousel skeleton mirrors ServicesSlider.tsx/
// ProcessCarousel.tsx exactly (step logic lives entirely in the pure `useCarousel` hook;
// always-rendered arrows with aria-disabled + opacity-[0.35] at bounds, inline-transform track,
// name-text dot row) — no aria-live, no touch handlers, no matchMedia.
//
// 2026-07-23 hero-demo-detail-slider design: each tile now renders the FULL demo detail —
// everything DemoModalContent shows (chip row + language chip, brand lockup, tagline,
// screenshot, detail paragraph, key-flows pill list, shared Technologies row, live-demo CTA +
// best-practices/desktop-only note) — transplanted the same way ServicesSlider.tsx transplanted
// ServiceModalContent's markup. The demo detail MODAL itself is untouched and still reachable
// from the Demos section's/`​/demos/`'s "View details ›" cards (CardActions kind="demo-card" →
// openDemoModal) — this component no longer opens it, so there is no useModal import/usage and
// no "Zobacz szczegóły" trigger here.
//
// Heading-order note: the tile's headline (`d.tagline`) is rendered as a bold <p>, NOT a
// heading — see the comment on that element below for why.
export function HeroDemoSlider({
  demos,
  label,
  langChip,
  flowsLabel,
  techLegend,
  liveCta,
  demoNote,
  desktopNote,
}: HeroDemoSliderProps) {
  const { step, next, prev, goTo } = useCarousel(demos.length, 0);
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
            aria-label="Poprzednie demo"
            aria-disabled={step === 0}
            onClick={prev}
            className={`${ARROW_BASE} ${PILL_FOCUS} ${step === 0 ? "opacity-[0.35]" : ""}`}
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Następne demo"
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
                aria-label={`${i + 1} z ${demos.length}`}
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

                {/* Chip row — tag + (per-demo) language chip, moved up here to mirror
                    DemoModalContent's layout (the modal keeps the same row at the top too). */}
                <div className="relative flex flex-wrap items-center gap-2.5">
                  <Chip tone="accent">{d.tag}</Chip>
                  {d.uiLang === "en" && <span className={LANG_CHIP_CLASS}>{langChip}</span>}
                </div>

                {/* Brand lockup for demos with their own visual identity (cadence/airlift) —
                    purely decorative alongside the tagline headline below, exactly like
                    DemoModalContent. */}
                {d.logoId && (
                  <DemoLogo logo={d.logoId} instanceId="slider" className="h-7 w-auto" />
                )}

                {/* Deliberately a <p>, not a heading: the hero's h1 is the page's only h1, and a
                    hero → h3 jump was the site's one failing Lighthouse a11y audit
                    (heading-order). A bold, appropriately-sized paragraph reproduces
                    DemoModalContent's h2 styling without adding a heading to the document
                    outline. See docs/superpowers/specs/
                    2026-07-23-hero-demo-detail-slider-design.md. */}
                <p className="max-w-[860px] text-[clamp(22px,2.6vw,30px)] font-bold leading-[1.12] tracking-[-0.02em]">
                  {d.tagline}
                </p>

                {/* Cropped preview of the mockup screenshot — the full view lives in the live
                    demo (footer link below). */}
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image */}
                <img
                  src={d.shot}
                  alt={d.shotAlt}
                  width={1440}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[min(36vh,380px)] w-full rounded-[var(--radius-grid-card)] border border-border-08 object-cover object-top"
                />

                <p className="relative text-[15px] leading-[1.6] text-ink-70">{d.detail}</p>

                <div className="flex flex-col gap-2">
                  <p className={SECTION_LABEL}>{flowsLabel}</p>
                  <ul className="m-0 flex flex-wrap gap-2 p-0">
                    {d.features.map((f) => (
                      <li
                        key={f}
                        className="list-none rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <p className={SECTION_LABEL}>{techLegend}</p>
                  <TechStack />
                </div>

                {/* Footer — the only interactive element left per tile is the external live
                    link, so it's also the only one needing roving tabIndex (inactive slides are
                    both aria-hidden and keyboard-inert). No aria-label: inactive slides are
                    aria-hidden so only the active slide's link is ever in the accessible tree
                    without `hidden`, and its visible text (liveCta) is already descriptive
                    (mirrors ServicesSlider's CTA reasoning). */}
                <div className="mt-auto flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[22px]">
                  <a
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={active ? undefined : -1}
                    className={`hit-44 ${PILL_FOCUS} inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 py-3 text-[15px] font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]`}
                  >
                    {liveCta}
                  </a>
                  {/* Desktop-only staff panels (HealthLab, Merdi Panel) get a second line,
                      styled as a warning, stacked under the best-practices note — see docs/
                      superpowers/specs/2026-07-21-desktop-only-demo-note-design.md ("Warning
                      treatment" revision). */}
                  <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-50">
                    <span>{demoNote}</span>
                    {d.desktopOnly && <WarningNote>{desktopNote}</WarningNote>}
                  </div>
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
              aria-label={`Przejdź do: ${d.name}`}
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
