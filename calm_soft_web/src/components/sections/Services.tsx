import { services } from "@/content/services";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FilledPill } from "@/components/ui/FilledPill";
import { ServicesSlider } from "@/components/interactive/ServicesSlider";

// Server component (SPEC §16 client/server boundary) — the section renders static content;
// interactivity lives in the client leaf `ServicesSlider` (docs/superpowers/specs/2026-07-22-
// services-slider-design.md), which replaced the 2×2 card grid + service modal with a
// one-tile-per-view slider whose tiles carry the full former modal content.
export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="reveal-group mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading
        id="services-heading"
        line1={site.sections.services.line1}
        line2={site.sections.services.line2}
      />
      <div className="mt-12">
        <ServicesSlider
          services={services}
          label={site.sections.services.sliderLabel}
          overviewLabel={site.sections.services.overviewLabel}
          fitLabel={site.sections.services.fitLabel}
          deliverLabel={site.sections.services.deliverLabel}
          approachLabel={site.sections.services.approachLabel}
          proofLabel={site.sections.services.proofLabel}
          readCaseLabel={site.sections.services.readCaseCta}
          ctaLabel={site.sections.services.cta}
          note={site.sections.services.note}
          solutionsLabel={site.sections.services.solutionsLabel}
          detailsLabel={site.sections.services.detailsCta}
        />
      </div>
      <div className="mt-10 flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-08 bg-surface p-[28px_30px] min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
        <p className="text-[17px] text-ink-85">{site.sections.services.pricingPrompt}</p>
        <FilledPill size="lg" as="a" href="/pricing/">
          {site.sections.services.pricingCta}
        </FilledPill>
      </div>
    </section>
  );
}
