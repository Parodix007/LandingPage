import type { Metadata } from "next";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { GhostPill } from "@/components/ui/GhostPill";
import { CardActions } from "@/components/interactive/CardActions";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import type { CaseStudy, Tone } from "@/content/types";

const title = site.work.metaTitle;
const description = site.work.metaDescription;

// metadataBase is inherited from layout.tsx — do not redeclare it here.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/work/" },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/work/",
  },
};

// Mirrors CaseStudies.tsx's tone lookup (ui/ is frozen, so this small table is duplicated
// locally rather than shared — same precedent as pricing/page.tsx's PricingCardItem).
const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

const HOVER_LIFT =
  "transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:-translate-y-1 focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]";

// Extracted so the main grid and the archive section below render identical compact case
// cards (2026-07-22 pl-copy handoff §5) without duplicating the JSX twice in this file.
function CaseCard({ c }: { c: CaseStudy }) {
  return (
    <div
      className={`card-host relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-7 ${HOVER_LIFT}`}
    >
      {/* Decorative glow + mono watermark — purely presentational, hidden from AT. */}
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
      <div className="text-[30px] font-bold leading-none tracking-[-0.03em] text-accent">{c.m1v}</div>
      <h3 className="text-[16px] font-semibold leading-[1.3]">{c.headline}</h3>
      <span className="text-[13px] text-ink-50">{c.client}</span>
      <div className="mt-auto pt-2">
        <CardActions
          kind="case-card"
          caseSlug={c.slug}
          readLabel="Przeczytaj historię ›"
          ariaLabel={`Przeczytaj historię: ${c.client}`}
        />
      </div>
    </div>
  );
}

// Server component — no 'use client' on the page itself (SPEC §6.1), but it wraps its content
// in InquiryProvider + ModalProvider (exactly like src/app/page.tsx) so the "Read the story"
// cards below can open the same case-study modal used on the homepage. Full index of every
// case study — the homepage (CaseStudies.tsx) only shows the 3 `site.featuredCaseSlugs` as big
// cards and links here for the rest (2026-07-20 work-page-and-round2-polish design doc). The
// main grid shows only non-archived cases; the archived one(s) render below in a separate
// "Archiwum" section (2026-07-22 pl-copy handoff §5) — the modal flow is identical either way.
export default function WorkPage() {
  const activeCases = cases.filter((c) => !c.archived);
  const archivedCases = cases.filter((c) => c.archived);

  return (
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <div className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]">
          <header className="mb-4">
            {/* Not SectionHeading (frozen, hardcoded h2) — same visual classes on a real h1,
                since this is a standalone page rather than a same-page section (mirrors
                pricing/page.tsx). */}
            <h1 className="m-0 text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.05] tracking-[-0.025em]">
              {site.work.heading.line1}
              <br />
              <span className="text-ink-50">{site.work.heading.line2}</span>
            </h1>
            <p className="mt-4 max-w-[600px] text-[18px] leading-[1.55] text-ink-70">{site.work.lead}</p>
          </header>

          <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
            {activeCases.map((c) => (
              <CaseCard key={c.slug} c={c} />
            ))}
          </div>

          {archivedCases.length > 0 && site.work.archiveHeading && (
            <div className="mt-16">
              <h2 className="text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-ink-70">
                {site.work.archiveHeading}
              </h2>
              {site.work.archiveIntro && (
                <p className="mt-2 max-w-[600px] text-[14.5px] leading-[1.55] text-ink-50">
                  {site.work.archiveIntro}
                </p>
              )}
              <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
                {archivedCases.map((c) => (
                  <CaseCard key={c.slug} c={c} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px] text-center">
            <p className="mx-auto mb-6 max-w-[560px] text-[17px] text-ink-85">{site.work.calendly.prompt}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <CalendlyCta variant="filled" label={site.work.calendly.cta} />
              <GhostPill tone="accent" size="lg" as="a" href="/#contact">
                {site.work.startLabel}
              </GhostPill>
            </div>
          </div>
        </div>
      </ModalProvider>
    </InquiryProvider>
  );
}
