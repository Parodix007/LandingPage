import type { Metadata } from "next";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { GhostPill } from "@/components/ui/GhostPill";
import { CalendlyCta } from "@/components/interactive/CalendlyCta";
import { SolutionLineBlock } from "@/components/sections/SolutionLineBlock";
import { SolutionsFilter, type SolutionsFilterGroup } from "@/components/interactive/SolutionsFilter";

const title = site.demosPage.metaTitle;
const description = site.demosPage.metaDescription;

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

// Server component — no 'use client' on the page itself (SPEC §16), but it wraps its content in
// InquiryProvider + ModalProvider (exactly like src/app/page.tsx and work/page.tsx) so the
// per-demo "View details" cards can open the same demo detail modal used on the homepage.
//
// 2026-07-26 solutions restructure: the old flat 7-demo grid is gone. In its place: a mechanism
// block (what's fixed vs. what's still to be built) and a two-paths block (as-is vs. custom
// pricing), both ABOVE the product lines since they set expectations before the reader hits any
// demo card — then the two solution groups (branżowe/operacyjne) from solutions.ts, each
// rendering its lines via <SolutionLineBlock>. All 8 demos still get a card with a details modal
// and an "open the mockup" link — they just live inside their line's card grid instead of one
// flat grid (heading order: h1 → h2 mechanizm → h2 drogi → h2 grupa → h3 linia → h4 karta).
//
// 2026-07-26 group-heading-and-filters: the two solution groups + their per-line product-line
// filter now live in the client leaf <SolutionsFilter> (SPEC docs/superpowers/specs/2026-07-26-
// solutions-group-heading-and-filters-design.md). This page stays a server component — it still
// builds every <SolutionLineBlock> here, on the server, with the same props as before, and only
// threads the finished nodes through as `SolutionsFilterGroup[]`.
const solutionGroups: SolutionsFilterGroup[] = solutions.groups.map((group) => ({
  slug: group.slug,
  eyebrow: group.eyebrow,
  sub: group.sub,
  tone: group.tone,
  lines: group.lines.map((line) => ({
    slug: line.slug,
    kicker: line.kicker,
    node: (
      <SolutionLineBlock
        key={line.slug}
        line={line}
        clickLabel={solutions.page.clickLabel}
        audienceLabel={solutions.page.audienceLabel}
        serviceLabel={solutions.page.serviceLabel}
        asIsLabel={solutions.page.paths.asIs.title}
        customLabel={solutions.page.paths.custom.title}
      />
    ),
  })),
}));

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

          {/* Mechanism block — the most important paragraph on the page (what's fixed before
              pricing vs. what still gets built after the decision), so it stands above the
              lines, not below them. Visually called out the same way as the closing CTA panel
              (border + surface fill). */}
          <section
            aria-labelledby="mechanizm"
            className="mt-12 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[40px_32px]"
          >
            <h2 id="mechanizm" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
              {solutions.page.mechanism.heading}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {solutions.page.mechanism.body.map((paragraph) => (
                <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="mt-4 text-[16px] leading-[1.6] text-ink-70">
              <strong className="text-ink">{solutions.page.mechanism.noDiscoverLabel}</strong>{" "}
              {solutions.page.mechanism.noDiscover}
            </p>
          </section>

          {/* Two-paths block — as-is vs. custom pricing, both priced before start. */}
          <section aria-labelledby="drogi" className="mt-16">
            <h2 id="drogi" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
              {solutions.page.paths.heading}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 min-[700px]:grid-cols-2">
              <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-[32px]">
                <strong className="text-[18px] font-bold text-ink">
                  {solutions.page.paths.asIs.title}
                </strong>
                <p className="mt-3 text-[15px] leading-[1.55] text-ink-70">
                  {solutions.page.paths.asIs.body}
                </p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-border-08 bg-surface p-[32px]">
                <strong className="text-[18px] font-bold text-ink">
                  {solutions.page.paths.custom.title}
                </strong>
                <p className="mt-3 text-[15px] leading-[1.55] text-ink-70">
                  {solutions.page.paths.custom.body}
                </p>
              </div>
            </div>
          </section>

          {/* Product-line groups (branżowe / operacyjne) + the filter that hides non-matching
              lines — client leaf, see file header. solutionGroups already carries the intended
              display order; the filter never sorts. */}
          <SolutionsFilter groups={solutionGroups} filters={solutions.page.filters} />

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
