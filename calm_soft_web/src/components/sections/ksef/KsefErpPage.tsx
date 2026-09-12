import type { KsefErpPage as KsefErpPageContent } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { RichText } from "@/components/ui/RichText";
import { CheckIcon } from "@/components/ui/icons";
import { HOVER_BORDER } from "@/components/ui/cardHover";
import { KsefPlanCta } from "@/components/interactive/KsefPlanCta";
import { SalesContact } from "@/components/sections/service-sales/SalesContact";
import { ServiceStickyCta } from "@/components/sections/service-sales/ServiceStickyCta";
import { ServiceDisclosure } from "@/components/sections/service-sales/ServiceDisclosure";
import { KsefPricingTable } from "./KsefPricingTable";

function CardGlow() {
  return <span aria-hidden="true" className="card-glow pointer-events-none -right-[120px] -top-[120px] h-[360px] w-[360px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]" />;
}

export function KsefErpPage({ page }: { page: KsefErpPageContent }) {
  return (
    <>
      <div data-background-family="services" className="mx-auto max-w-[1200px] px-6 py-5 min-[900px]:py-[110px]">
        <header className="service-hero ksef-surface reveal-group p-6 min-[900px]:px-10 min-[900px]:py-12">
          <CardGlow />
          <div className="relative z-[1] flex max-w-[720px] flex-col">
            <Chip tone="accent">{page.hero.eyebrow}</Chip>
            <h1 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.025em] min-[900px]:mt-4 min-[900px]:text-[clamp(36px,4.5vw,56px)] min-[900px]:leading-[1.05]">{page.hero.h1}</h1>
            <p className="mt-3 max-w-[720px] text-[18px] leading-[1.55] text-ink-70"><RichText>{page.hero.lead}</RichText></p>
            <p className="mt-4 text-[20px] font-semibold text-ink">{page.hero.note}</p>
            <ul className="mt-4 grid gap-2 text-[15px] text-ink-85 min-[700px]:grid-cols-2">
              {page.hero.bullets.map((bullet) => <li key={bullet} className="flex items-start gap-2"><CheckIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span><RichText>{bullet}</RichText></span></li>)}
            </ul>
            <div className="mt-6 flex w-full flex-col gap-3 min-[900px]:w-fit min-[900px]:flex-row">
              <FilledPill size="lg" as="a" href={page.contactHref}>{page.hero.cta}</FilledPill>
              <GhostPill tone="accent" size="lg" as="a" href="#cennik">{page.hero.pricingCta}</GhostPill>
            </div>
          </div>
        </header>

        <section className="reveal-group mt-16" aria-labelledby="ksef-legacy">
          <h2 id="ksef-legacy" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.legacy.title}</h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70"><RichText>{page.legacy.body}</RichText></p>
          <ol className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
            {page.legacy.steps.map((step, index) => <li key={step.title} className="service-card ksef-surface-compact p-6"><span className="text-[52px] font-bold leading-none text-accent">0{index + 1}</span><h3 className="mt-2 text-[22px] font-bold leading-[1.15]"><RichText>{step.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{step.body}</RichText></p></li>)}
          </ol>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent"><RichText>{page.legacy.claim}</RichText></p>
          <div className="mt-6 w-full min-[900px]:w-fit"><FilledPill size="lg" as="a" href={page.contactHref}>{page.legacy.cta}</FilledPill></div>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-development">
          <h2 id="ksef-development" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.development.title}</h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70"><RichText>{page.development.intro}</RichText></p>
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {page.development.items.map((item) => <li key={item.title} className={`service-card relative overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-6 ${HOVER_BORDER}`}><CardGlow /><div className="relative z-[1]"><h3 className="text-[22px] font-bold leading-[1.15]"><RichText>{item.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{item.body}</RichText></p></div></li>)}
          </ul>
          <div className="mt-6 grid gap-3 min-[900px]:grid-cols-2"><p className="ksef-surface-compact p-5 text-[15px] leading-[1.6] text-ink-85"><RichText>{page.development.standardNote}</RichText></p><p className="ksef-surface-compact p-5 text-[15px] leading-[1.6] text-ink-85"><RichText>{page.development.proNote}</RichText></p></div>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-coverage">
          <h2 id="ksef-coverage" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.coverage.title}</h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70"><RichText>{page.coverage.intro}</RichText></p>
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {page.coverage.tiles.map((tile) => <li key={tile.title} className={`service-card relative overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-6 ${HOVER_BORDER}`}><CardGlow /><div className="relative z-[1]"><h3 className="text-[22px] font-bold leading-[1.15]"><RichText>{tile.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{tile.body}</RichText></p>{tile.highlight && <p className="mt-4 border-l-2 border-accent pl-4 text-[17px] font-bold leading-[1.4] text-accent"><RichText>{tile.highlight}</RichText></p>}</div></li>)}
          </ul>
        </section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-monitoring">
          <h2 id="ksef-monitoring" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.monitoring.title}</h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70"><RichText>{page.monitoring.intro}</RichText></p>
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">{page.monitoring.items.map((item) => <li key={item.title} className="service-card ksef-surface-compact p-6"><h3 className="text-[22px] font-bold leading-[1.15]"><RichText>{item.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{item.body}</RichText></p></li>)}</ul>
          <p className="mt-6 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.02em] text-accent"><RichText>{page.monitoring.claim}</RichText></p>
        </section>

        <section id="cennik" className="reveal-group mt-16" aria-labelledby="ksef-pricing"><h2 id="ksef-pricing" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.pricing.title}</h2><div className="mt-6"><KsefPricingTable pricing={page.pricing} /></div></section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-comparison"><h2 id="ksef-comparison" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.comparison.title}</h2><p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70"><RichText>{page.comparison.intro}</RichText></p><div className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2"><article className="ksef-surface p-6"><h3 className="text-[22px] font-bold">{page.comparison.standard.title}</h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{page.comparison.standard.body}</RichText></p></article><article className="ksef-surface ksef-surface-featured p-6"><h3 className="text-[22px] font-bold">{page.comparison.pro.title}</h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{page.comparison.pro.body}</RichText></p></article></div><p className="mt-6 text-[18px] font-semibold text-accent"><RichText>{page.comparison.note}</RichText></p></section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-other-erp"><h2 id="ksef-other-erp" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.otherErp.title}</h2><div className="mt-4 flex max-w-[720px] flex-col gap-4">{page.otherErp.body.map((paragraph) => <p key={paragraph} className="text-[16px] leading-[1.6] text-ink-70"><RichText>{paragraph}</RichText></p>)}</div><div className="mt-6"><KsefPlanCta label={page.otherErp.cta} prefill={page.otherErp.prefill} /></div></section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-how"><h2 id="ksef-how" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.howItWorks.title}</h2><ol className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">{page.howItWorks.steps.map((step, index) => <li key={step.title} className="service-card ksef-surface-compact p-6"><span className="text-[52px] font-bold leading-none text-accent">0{index + 1}</span><h3 className="mt-2 text-[22px] font-bold leading-[1.15]"><RichText>{step.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{step.body}</RichText></p></li>)}</ol></section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-audience"><h2 id="ksef-audience" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.audience.title}</h2><p className="mt-4 text-[18px] font-semibold text-ink"><RichText>{page.audience.intro}</RichText></p><ul className="mt-6 grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">{page.audience.items.map((item) => <li key={item.title} className="service-card ksef-surface-compact p-6"><h3 className="text-[22px] font-bold leading-[1.15]"><RichText>{item.title}</RichText></h3><p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{item.body}</RichText></p></li>)}</ul></section>

        <section className="reveal-group mt-16" aria-labelledby="ksef-faq"><h2 id="ksef-faq" className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{page.faq.title}</h2><ul className="mt-6 grid gap-4">{page.faq.items.map((item) => <li key={item.question}><ServiceDisclosure title={item.question}><p className="pt-4 text-[16px] leading-[1.6] text-ink-70"><RichText>{item.answer}</RichText></p></ServiceDisclosure></li>)}</ul></section>

        <section className="reveal-group ksef-surface mt-16 p-8 text-center min-[900px]:p-12" aria-labelledby="ksef-final"><h2 id="ksef-final" className="text-[clamp(28px,4vw,44px)] font-bold">{page.finalCta.title}</h2><p className="mt-4 text-[16px] leading-[1.6] text-ink-70"><RichText>{page.finalCta.body}</RichText></p><div className="mt-6 flex justify-center"><FilledPill size="lg" as="a" href={page.contactHref}>{page.finalCta.cta}</FilledPill></div></section>
      </div>
      <div id="kontakt"><SalesContact copy={page.contact} /></div>
      <ServiceStickyCta href={page.contactHref} label={page.contact.stickyCta} />
    </>
  );
}
