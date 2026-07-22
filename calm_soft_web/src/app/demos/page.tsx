import type { Metadata } from "next";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { WarningNote } from "@/components/ui/WarningNote";
import { GhostPill } from "@/components/ui/GhostPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { DemoLogo } from "@/components/ui/DemoLogo";
import { CardActions } from "@/components/interactive/CardActions";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";

const title = site.demosPage.metaTitle;
const description = site.demosPage.metaDescription;

// Shared "chip" treatment for the per-demo language note (2026-07-22 pl-copy handoff §6) —
// mirrors Demos.tsx's / DemoModalContent's local constant (ui/ is frozen, so no new shared
// primitive).
const LANG_CHIP_CLASS =
  "inline-flex items-center rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70";

// metadataBase is inherited from layout.tsx — do not redeclare it here.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/demos/" },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/demos/",
  },
};

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Server component — no 'use client' on the page itself (SPEC §6.1), but it wraps its content
// in InquiryProvider + ModalProvider (exactly like src/app/page.tsx and work/page.tsx) so the
// "View details" cards below can open the same demo detail modal used on the homepage. Full
// index of all 5 demos — the homepage (Demos.tsx) only shows the 3 `site.featuredDemoSlugs` as
// featured cards and links here for the rest (2026-07-20 demo-detail-modal-and-demos-subpage
// design doc). The demo-card markup is intentionally duplicated from Demos.tsx (same precedent
// as work/page.tsx duplicating CaseStudies.tsx's case-card markup).
export default function DemosPage() {
  return (
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <div className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]">
          <header className="mb-4">
            {/* Not SectionHeading (frozen, hardcoded h2) — same visual classes on a real h1,
                since this is a standalone page rather than a same-page section (mirrors
                work/page.tsx & pricing/page.tsx). */}
            <h1 className="m-0 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">
              {site.demosPage.heading.line1}
              <br />
              <span className="text-ink-50">{site.demosPage.heading.line2}</span>
            </h1>
            <p className="mt-4 max-w-[600px] text-[18px] leading-[1.55] text-ink-70">
              {site.demosPage.lead}
            </p>
          </header>

          <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-6">
            {demos.map((d) => (
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
                  <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">
                    {d.logoId ? (
                      <DemoLogo logo={d.logoId} instanceId="page" className="h-7 w-auto" />
                    ) : (
                      d.name
                    )}
                  </h3>
                  <p className="text-[14.5px] leading-[1.55] text-ink-70">{d.description}</p>
                  {/* Desktop-only staff panels (HealthLab, Merdi Panel) get a warning caveat
                      before the external "Open the demo" link — see docs/superpowers/specs/
                      2026-07-21-desktop-only-demo-note-design.md ("Warning treatment" revision). */}
                  {d.desktopOnly && <WarningNote>{site.sections.demos.desktopNote}</WarningNote>}
                </div>

                {/* Whole-card click = View details (stretched via CardActions). The external
                    "Open the demo" link is a sibling raised above the stretched hit-area
                    (relative z-10) — same sibling-CTA pattern as the case card. */}
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

          <div className="mt-16 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px] text-center">
            <p className="mx-auto mb-6 max-w-[560px] text-[17px] text-ink-85">
              {site.demosPage.calendly.prompt}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <CalendlyCta variant="filled" label={site.demosPage.calendly.cta} />
              <GhostPill tone="accent" size="lg" as="a" href="/#contact">
                {site.demosPage.startLabel}
              </GhostPill>
            </div>
          </div>
        </div>
      </ModalProvider>
    </InquiryProvider>
  );
}
