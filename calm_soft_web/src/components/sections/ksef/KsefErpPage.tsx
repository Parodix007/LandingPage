import type { KsefErpPage as KsefErpPageContent } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { FilledPill } from "@/components/ui/FilledPill";
import { RichText } from "@/components/ui/RichText";
import { CheckIcon, WarningIcon } from "@/components/ui/icons";
import { HOVER_BORDER } from "@/components/ui/cardHover";
import { KsefPlanCta } from "@/components/interactive/KsefPlanCta";
import { SalesContact } from "@/components/sections/service-sales/SalesContact";
import { ServiceStickyCta } from "@/components/sections/service-sales/ServiceStickyCta";
import { ServiceDisclosure } from "@/components/sections/service-sales/ServiceDisclosure";
import { KsefPricingTable } from "./KsefPricingTable";

// Decorative glow span, transplanted from ServiceSalesPage.tsx's private `CardGlow` /
// KsefTeaser.tsx's inlined equivalent (both frozen or private elsewhere, so the markup is
// duplicated locally per the same precedent those files document).
function CardGlow() {
  return (
    <span
      aria-hidden="true"
      className="card-glow pointer-events-none -right-[120px] -top-[120px] h-[360px] w-[360px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
    />
  );
}

// Server component (2026-09-09 ksef-product-pages design, rev. 3) — the `/ksef/<erp>/` product
// page: hero → problem → coverage → reliability → how it works → legacy → pricing → savings →
// support → faq → final CTA → SalesContact → ServiceStickyCta. Comparison section removed
// (owner decision, rev. 3). Root is a plain `<div>`, not `<main>` — layout.tsx already renders
// the page's `<main>`. Heading order: h1 (hero) → h2 per section → h3 inside (coverage tiles,
// step titles, plan names, FAQ questions via ServiceDisclosure).
export function KsefErpPage({ page }: { page: KsefErpPageContent }) {
  return (
    <>
      <div data-background-family="services" className="mx-auto max-w-[1200px] px-6 py-5 min-[900px]:py-[110px]">
        <header className="service-hero ksef-surface reveal-group p-6 min-[900px]:px-10 min-[900px]:py-12">
          <CardGlow />
          <div className="relative z-[1] flex max-w-[720px] flex-col">
            <Chip tone="accent">{page.hero.eyebrow}</Chip>
            <h1 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.025em] min-[900px]:mt-4 min-[900px]:text-[clamp(36px,4.5vw,56px)] min-[900px]:leading-[1.05]">
              {page.hero.h1}
            </h1>
            <p className="mt-3 max-w-[720px] text-[18px] leading-[1.55] text-ink-70">
              <RichText>{page.hero.lead}</RichText>
            </p>
            <p className="mt-4 text-[20px] font-semibold text-ink">{page.hero.note}</p>
            <div className="mt-6 w-full min-[900px]:w-fit">
              <FilledPill size="lg" as="a" href={page.contactHref}>{page.hero.cta}</FilledPill>
            </div>
          </div>
        </header>

        <section className="reveal-group mt-16" aria-labelledby="ksef-problem">
          <h2 id="ksef-problem" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.problem.title}
          </h2>
          <div className="mt-4 flex max-w-[720px] flex-col gap-4">
            {page.problem.body.map((paragraph) => (
              <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
                <RichText>{paragraph}</RichText>
              </p>
            ))}
          </div>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent">
            {page.problem.badge}
          </p>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-ink">
            <RichText>{page.problem.punchline}</RichText>
          </p>
        </section>

        <section id="funkcje" className="reveal-group mt-16" aria-labelledby="ksef-coverage">
          <h2 id="ksef-coverage" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.coverage.title}
          </h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
            <RichText>{page.coverage.intro}</RichText>
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {page.coverage.tiles.map((tile) => (
              <li
                key={tile.title}
                className={`service-card relative overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-6 ${HOVER_BORDER}`}
              >
                <CardGlow />
                <div className="relative z-[1]">
                  <h3 className="text-[22px] font-bold leading-[1.15] tracking-[-0.02em]"><RichText>{tile.title}</RichText></h3>
                  <p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{tile.body}</RichText></p>
                  {tile.highlight && (
                    <p className="mt-4 border-l-2 border-accent pl-4 text-[17px] font-bold leading-[1.4] tracking-[-0.01em] text-accent"><RichText>{tile.highlight}</RichText></p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-reliability">
          <h2 id="ksef-reliability" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.reliability.title}
          </h2>
          <div className="mt-4 flex max-w-[720px] flex-col gap-4">
            {page.reliability.body.map((paragraph) => (
              <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
                <RichText>{paragraph}</RichText>
              </p>
            ))}
          </div>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent">
            <RichText>{page.reliability.claim}</RichText>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {page.reliability.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="text-[15px] leading-[1.5] text-ink-85"><RichText>{item}</RichText></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-how">
          <h2 id="ksef-how" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.howItWorks.title}
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {page.howItWorks.steps.map((step, i) => (
              <li key={step.title} className="service-card ksef-surface-compact relative overflow-hidden p-6">
                <span className="text-[52px] font-bold leading-none tracking-[-0.03em] text-accent">0{i + 1}</span>
                <h3 className="mt-2 text-[22px] font-bold leading-[1.15] tracking-[-0.02em]"><RichText>{step.title}</RichText></h3>
                <p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{step.body}</RichText></p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em]">
            <RichText>{page.howItWorks.punchline}</RichText>
          </p>
        </section>

        <section id="starsza-optima" className="reveal-group mt-16" aria-labelledby="ksef-legacy">
          <div className="ksef-surface ksef-surface-featured relative overflow-hidden p-7 min-[900px]:p-10">
            <CardGlow />
            <div className="relative z-[1]">
              <h2 id="ksef-legacy" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
                {page.legacy.title}
              </h2>
              <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
                <RichText>{page.legacy.body}</RichText>
              </p>
              <p className="mt-6 text-[clamp(22px,3.2vw,36px)] font-bold leading-[1.1] tracking-[-0.025em] text-accent">
                <RichText>{page.legacy.claim}</RichText>
              </p>
              <div className="mt-6 w-full min-[900px]:w-fit">
                <FilledPill size="lg" as="a" href={page.contactHref}>{page.hero.cta}</FilledPill>
              </div>
            </div>
          </div>
          <div className="ksef-surface-compact ksef-surface mt-4 flex items-start gap-3 p-5 min-[900px]:p-6">
            <WarningIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <div>
              <p className="font-semibold text-ink">{page.legacy.notice.label}</p>
              {page.legacy.notice.body.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-[15px] leading-[1.6] text-ink-85">
                  <RichText>{paragraph}</RichText>
                </p>
              ))}
            </div>
          </div>
        </section>

        <section id="cennik" className="reveal-group mt-16" aria-labelledby="ksef-pricing">
          <h2 id="ksef-pricing" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.pricing.title}
          </h2>
          <div className="mt-6">
            <KsefPricingTable pricing={page.pricing} />
          </div>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-savings">
          <h2 id="ksef-savings" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.savings.title}
          </h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">
            <RichText>{page.savings.body}</RichText>
          </p>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent">
            <RichText>{page.savings.claim}</RichText>
          </p>
          <div className="mt-6">
            <KsefPlanCta label={page.savings.cta} prefill={page.savings.prefill} />
          </div>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-support">
          <h2 id="ksef-support" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.support.title}
          </h2>
          <div className="mt-4 flex max-w-[720px] flex-col gap-4">
            {page.support.body.map((paragraph) => (
              <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70">
                <RichText>{paragraph}</RichText>
              </p>
            ))}
          </div>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent">
            <RichText>{page.support.claim}</RichText>
          </p>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-faq">
          <h2 id="ksef-faq" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
            {page.faq.title}
          </h2>
          <ul className="mt-6 grid gap-4">
            {page.faq.items.map((item) => (
              <li key={item.question}>
                <ServiceDisclosure title={item.question}>
                  <p className="pt-4 text-[16px] leading-[1.6] text-ink-70">
                    <RichText>{item.answer}</RichText>
                  </p>
                </ServiceDisclosure>
              </li>
            ))}
          </ul>
        </section>

        <section className="reveal-group ksef-surface mt-16 p-8 text-center min-[900px]:p-12" aria-labelledby="ksef-final">
          <h2 id="ksef-final" className="text-[clamp(28px,4vw,44px)] font-bold">{page.finalCta.title}</h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-ink-70"><RichText>{page.finalCta.body}</RichText></p>
          <p className="mt-4 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em]">
            <RichText>{page.finalCta.claim}</RichText>
          </p>
          <div className="mt-6 flex justify-center">
            <FilledPill size="lg" as="a" href={page.contactHref}>{page.finalCta.cta}</FilledPill>
          </div>
        </section>
      </div>

      {/* Wrapper carries the Google Ads sitelink anchor; SalesContact already owns id="contact" and is frozen (2026-09-10). */}
      <div id="kontakt">
        <SalesContact copy={page.contact} />
      </div>
      <ServiceStickyCta href={page.contactHref} label={page.contact.stickyCta} />
    </>
  );
}
