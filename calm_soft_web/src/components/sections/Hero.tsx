import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { site } from "@/content/site";
import { getCaseBySlug } from "@/content/cases";
import { HeroCaseSlider } from "@/components/interactive/HeroCaseSlider";
import { KsefSwitchOffer } from "@/components/sections/ksef/KsefSwitchOffer";
import { ServiceStickyCta } from "@/components/sections/service-sales/ServiceStickyCta";
import { getKsefErpBySlug } from "@/content/ksef";
import type { CaseStudy } from "@/content/types";

// Server component. Carries id="top" as the header wordmark's scroll target (Nav.tsx links
// to /#top). All copy from site.hero/site.eyebrow.

function HeroEyebrow() {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
      {site.eyebrow}
    </p>
  );
}

export function Hero() {
  const { code } = site.hero;
  const heroCases = site.featuredCaseSlugs
    .map((slug) => getCaseBySlug(slug))
    .filter((c): c is CaseStudy => c !== undefined);
  const switchOffer = getKsefErpBySlug("rachmistrz-nexo")?.switchOffer;

  return (
    <section
      id="top"
      aria-label="Hero"
      data-background-family="home"
      className="flex min-h-[88vh] w-full flex-col items-center"
    >
      {switchOffer ? <KsefSwitchOffer offer={switchOffer} contactHref="/ksef/rachmistrz-nexo/#contact" variant="compact" /> : null}
      <div className="relative w-full">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,color-mix(in_oklch,var(--color-accent)_14%,transparent)_0%,transparent_70%)]"
        />
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-start gap-16 px-6 py-[100px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <HeroEyebrow />
            <h1 className="mt-5 text-[clamp(44px,5.5vw,72px)] font-bold leading-[1.05] tracking-[-0.03em]">
              {code.h1}
            </h1>
            <p className="mt-6 max-w-[540px] text-[20px] leading-[1.5] text-ink-72">{code.lead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <FilledPill size="lg" as="a" href="/#contact">
                {code.ctaPrimary}
              </FilledPill>
              <GhostPill tone="accent" size="lg" as="a" href="/pricing/">
                {code.ctaPricing}
              </GhostPill>
            </div>
          </div>
          <HeroCaseSlider
            cases={heroCases}
            label={code.casesLabel}
            readCaseLabel={site.sections.services.readCaseCta}
          />
        </div>
      </div>
      {switchOffer ? <ServiceStickyCta href={switchOffer.entryHref} label={switchOffer.stickyLabel} floating={{ startId: "nexo-switch-banner", hideIds: ["contact"] }} /> : null}
    </section>
  );
}
