import { ksef } from "@/content/ksef";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { Watermark } from "@/components/ui/Watermark";
import { RichText } from "@/components/ui/RichText";
import { HOVER_LIFT } from "@/components/ui/cardHover";

// Server component (SPEC §16 client/server boundary — no interactivity here, so no 'use
// client'). KSeF product teaser (2026-09-09 ksef-product-pages design, "Krok 4 B") — sits
// between Services and CaseStudies on the homepage and links out to the per-ERP page(s) in
// `ksef.erps`. Card markup mirrors the `CardGlow`/`Watermark` pattern from
// `service-sales/ServiceSalesPage.tsx`; `CardGlow` itself is private there, so its `card-glow`
// span markup is inlined rather than imported.
export function KsefTeaser() {
  const { teaser, erps } = ksef;
  return (
    <section
      id={teaser.id}
      aria-labelledby="ksef-heading"
      className="reveal-group mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading id="ksef-heading" line1={teaser.heading} />
      <div className="mt-6 flex max-w-[720px] flex-col gap-4">
        {teaser.body.map((paragraph) => (
          <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
            <RichText>{paragraph}</RichText>
          </p>
        ))}
      </div>
      <p className="mt-6 max-w-[720px] text-[18px] font-semibold text-ink"><RichText>{teaser.tagline}</RichText></p>
      <div className="mt-6">
        <FilledPill size="lg" as="a" href="#ksef-erp">
          {teaser.cta}
        </FilledPill>
      </div>
      <div className="mt-12">
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {teaser.erpListLabel}
        </h3>
        <ul id="ksef-erp" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
          {erps.map((erp) => (
            <li
              key={erp.slug}
              className={`card-host service-card ksef-surface-compact relative overflow-hidden p-6 ${HOVER_LIFT}`}
            >
              <span
                aria-hidden="true"
                className="card-glow pointer-events-none -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)] service-card-glow-interactive"
              />
              <span aria-hidden="true" className="service-card-watermark pointer-events-none absolute right-[26px] top-6">
                <Watermark />
              </span>
              <p className="relative z-[1] text-[18px] font-semibold text-ink">{erp.name}</p>
              <div className="relative z-[1] mt-4">
                <GhostPill
                  tone="accent"
                  size="sm"
                  stretched
                  as="a"
                  href={`/ksef/${erp.slug}/`}
                  aria-label={`${teaser.erpCta} ${erp.name}`}
                >
                  {teaser.erpCta}
                </GhostPill>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
