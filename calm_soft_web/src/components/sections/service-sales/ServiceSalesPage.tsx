import { getCaseBySlug } from "@/content/cases";
import { serviceSales, type SalesGroup, type ServiceSalesPage as SalesPage } from "@/content/serviceSales";
import type { ServiceArt } from "@/content/types";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { Watermark } from "@/components/ui/Watermark";
import { CheckIcon } from "@/components/ui/icons";
import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { CardActions } from "@/components/interactive/CardActions";
import { HOVER_LIFT, HOVER_BORDER } from "@/components/ui/cardHover";
import { RichText } from "@/components/ui/RichText";
import { SalesContact } from "./SalesContact";
import { ServiceStickyCta } from "./ServiceStickyCta";
import { ServiceDemoShowcase } from "./ServiceDemoShowcase";
import { ServiceDisclosure } from "./ServiceDisclosure";

function CardGlow({ interactive = false }: { interactive?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`card-glow pointer-events-none -right-[80px] -top-[80px] h-[220px] w-[220px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)] ${interactive ? "service-card-glow-interactive" : ""}`}
    />
  );
}

function Group({ group, contactHref }: { group: SalesGroup; contactHref: string }) {
  return (
    <section className="reveal-group mt-16" aria-labelledby={`sales-${group.title}`}>
      <h2 id={`sales-${group.title}`} className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">
        {group.title}
      </h2>
      {group.intro && <p className="mt-4 max-w-[720px] whitespace-pre-line text-[16px] leading-[1.6] text-ink-70">{group.intro}</p>}
      {group.bullets ? (
        <ul className="mt-6 grid grid-cols-1 gap-4 text-[16px] leading-[1.55] text-ink-70 min-[900px]:grid-cols-2">
          {group.bullets.map((bullet) => (
            <li key={bullet} className={`service-card relative overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-5 ${HOVER_BORDER}`}>
              <CardGlow />
              <span aria-hidden="true" className="service-card-watermark pointer-events-none absolute right-[26px] top-6 hidden min-[900px]:block"><Watermark /></span>
              <div className="relative z-[1] flex items-start gap-3 min-[900px]:pr-[140px]">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0"><RichText>{bullet}</RichText></span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {(group.items ?? []).map((item) => (
            <article key={item.title} className={`service-card relative grid grid-cols-1 gap-6 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-6 min-[900px]:grid-cols-[0.8fr_1.2fr] min-[900px]:items-center min-[900px]:gap-12 min-[900px]:p-[44px_48px] ${HOVER_BORDER}`}>
              <CardGlow />
              <span aria-hidden="true" className="service-card-watermark pointer-events-none absolute right-[34px] top-7 hidden min-[900px]:block"><Watermark /></span>
              <h3 className="relative z-[1] text-[22px] font-bold leading-[1.15] tracking-[-0.02em]">{item.title}</h3>
              <p className="relative z-[1] whitespace-pre-line text-[16px] leading-[1.6] text-ink-70 min-[900px]:pr-[140px]"><RichText>{item.body}</RichText></p>
            </article>
          ))}
        </div>
      )}
      {group.cta && (
        <div className="mt-6">
          <FilledPill size="lg" as="a" href={contactHref}>{group.cta}</FilledPill>
        </div>
      )}
    </section>
  );
}

function Proof({ page }: { page: SalesPage }) {
  const cases = page.proof.caseSlugs.map(getCaseBySlug).filter(Boolean);
  return (
    <section className="reveal-group mt-16" aria-labelledby="sales-proof">
      <h2 id="sales-proof" className="text-[26px] font-bold">{page.proof.title}</h2>
      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
        {cases.map((item) => item && (
          <article key={item.slug} className={`card-host service-card service-card-interactive relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-grid-card)] border border-border-08 bg-surface p-7 ${HOVER_LIFT}`}>
            <CardGlow interactive />
            <span aria-hidden="true" className="service-card-watermark pointer-events-none absolute right-[26px] top-6"><Watermark /></span>
            <div className="z-[1] flex flex-col gap-3">
              <Chip tone="accent">{item.tag}</Chip>
              <h3 className="text-[16px] font-semibold">{item.headline}</h3>
              <p className="text-[15px] leading-[1.5] text-ink-70">{item.teaser}</p>
              <div className="grid grid-cols-2 gap-3 border-t border-border-08 pt-3 text-[13px] text-ink-70">
                <span><strong className="block text-[18px] text-ink">{item.m1v}</strong>{item.m1l}</span>
                {item.m2v && item.m2l && <span><strong className="block text-[18px] text-ink">{item.m2v}</strong>{item.m2l}</span>}
              </div>
              <CardActions kind="case-card" caseSlug={item.slug} readLabel={site.sections.services.readCaseCta} ariaLabel={`${site.sections.services.readCaseCta} ${item.client}`} />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <FilledPill size="lg" as="a" href={page.contactHref}>{page.proof.cta}</FilledPill>
      </div>
    </section>
  );
}

function Process({ page }: { page: SalesPage }) {
  return (
    <section className="reveal-group mt-16">
      <h2 className="text-[26px] font-bold">{page.process.title}</h2>
      <ol className="mt-6 flex flex-col gap-4">
        {page.process.steps.map((step, i) => (
          <li key={step.title} className={`service-card relative grid grid-cols-[auto_1fr] gap-x-5 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-6 min-[900px]:gap-x-10 min-[900px]:p-[44px_48px] ${HOVER_BORDER}`}>
            <CardGlow />
            <span aria-hidden="true" className="service-card-watermark pointer-events-none absolute right-[34px] top-7 hidden min-[900px]:block"><Watermark /></span>
            <span className="relative z-[1] text-[52px] font-bold leading-none tracking-[-0.03em] text-accent">0{i + 1}</span>
            <div className="relative z-[1]">
              <h3 className="text-[22px] font-bold leading-[1.15] tracking-[-0.02em] min-[900px]:pr-[140px]">{step.title}</h3>
              <p className="mt-2 text-[16px] leading-[1.6] text-ink-70"><RichText>{step.body}</RichText></p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PricingTechFaq({ page }: { page: SalesPage }) {
  return (
    <>
      <section className={`service-card relative mt-16 overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-7 ${HOVER_BORDER}`}>
        <CardGlow />
        <div className="relative z-[1]">
          <h2 className="text-[26px] font-bold">{page.pricing.title}</h2>
          <p className="mt-4 max-w-[720px] text-[16px] leading-[1.6] text-ink-70">{page.pricing.body}</p>
          <div className="mt-5">
            <GhostPill tone="accent" size="sm" as="a" href="/pricing/">{page.pricing.cta}</GhostPill>
          </div>
        </div>
      </section>
      <section className="mt-16">
        <ServiceDisclosure title={page.technology.title}>
          {page.technology.intro && <p className="mt-4 text-[15px] leading-[1.6] text-ink-70">{page.technology.intro}</p>}
          <p className="mt-4 max-w-[720px] whitespace-pre-line text-[15px] leading-[1.6] text-ink-70">{page.technology.body}</p>
        </ServiceDisclosure>
      </section>
      <section className="mt-16">
        <h2 className="text-[26px] font-bold">{page.faqTitle ?? ""}</h2>
        <div className="mt-5 flex flex-col gap-3">
          {page.faq.map((item) => (
            <ServiceDisclosure key={item.question} title={item.question}>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-70">{item.answer}</p>
            </ServiceDisclosure>
          ))}
        </div>
      </section>
    </>
  );
}

function CoreComposition({ page }: { page: Extract<SalesPage, { id: "core" }> }) {
  return <><Group group={page.problems} contactHref={page.contactHref} /><Group group={page.systems} contactHref={page.contactHref} /><Proof page={page} /><Group group={page.scope} contactHref={page.contactHref} /><Process page={page} /><ServiceDemoShowcase mode="grid" title={page.demosTitle} demos={page.demos} /><PricingTechFaq page={page} /></>;
}

function AutomationComposition({ page }: { page: Extract<SalesPage, { id: "automation" }> }) {
  return <><Group group={page.candidates} contactHref={page.contactHref} /><Proof page={page} /><Group group={page.criteria} contactHref={page.contactHref} /><Group group={page.scope} contactHref={page.contactHref} /><Process page={page} /><ServiceDemoShowcase mode="grid" title={page.demosTitle} demos={page.demos} /><PricingTechFaq page={page} /></>;
}

function WebComposition({ page }: { page: Extract<SalesPage, { id: "web" }> }) {
  return <><ServiceDemoShowcase mode="carousel" title={page.demosTitle} intro={page.demosIntro} demos={page.demos} /><Group group={page.appTypes} contactHref={page.contactHref} /><Proof page={page} /><Group group={page.scope} contactHref={page.contactHref} /><Process page={page} /><Group group={{ title: page.deliverablesTitle ?? "", bullets: page.deliverables }} contactHref={page.contactHref} /><PricingTechFaq page={page} /></>;
}

export function ServiceSalesPage({ page, art }: { page: SalesPage; art: ServiceArt }) {
  return <>
    <main data-background-family="services" className="mx-auto max-w-[1200px] px-6 py-5 min-[900px]:py-[110px]">
      <header className="service-hero service-sales-hero !p-4 min-[900px]:!px-10 min-[900px]:!py-12">
        <div className="relative z-10 flex max-w-[720px] flex-col">
          <Chip tone="accent">{page.hero.eyebrow}</Chip>
          <h1 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.025em] min-[900px]:mt-4 min-[900px]:text-[clamp(36px,4.5vw,56px)] min-[900px]:leading-[1.05]">{page.hero.h1}</h1>
          <p className="mt-3 text-[16px] leading-[1.4] text-ink-70 min-[900px]:mt-4 min-[900px]:text-[18px] min-[900px]:leading-[1.55]">{page.hero.lead}</p>
          <div className="order-3 mt-4 w-full min-[900px]:order-4 min-[900px]:mt-7 min-[900px]:w-fit">
            <FilledPill size="lg" as="a" href={page.contactHref}>{page.hero.cta}</FilledPill>
          </div>
          <div className="order-4 mt-3 min-[900px]:order-3 min-[900px]:mt-4">
            <p className="text-[15px] leading-[1.55] text-ink-60">{page.hero.note}</p>
          </div>
        </div>
        <div aria-hidden="true" className="service-sales-hero-art">
          <picture>
            <source media="(min-width: 900px)" srcSet={art.desktop} />
            <img src={art.mobile} alt="" width={1200} height={1200} loading="eager" decoding="sync" fetchPriority="high" />
          </picture>
        </div>
      </header>
      {page.id === "core" ? <CoreComposition page={page} /> : page.id === "automation" ? <AutomationComposition page={page} /> : <WebComposition page={page} />}
      <div className="mt-12">
        <FilledPill size="lg" as="a" href={page.contactHref}>{page.contact.cta}</FilledPill>
      </div>
    </main>
    <SalesContact copy={page.contact} />
    <ServiceStickyCta href={page.contactHref} label={page.contact.stickyCta} />
  </>;
}

export function getServiceSalesPage(id: "core" | "automation" | "web") { return serviceSales[id]; }
