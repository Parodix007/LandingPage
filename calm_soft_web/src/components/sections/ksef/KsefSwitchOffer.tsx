import type { KsefSwitchOfferContent } from "@/content/types";
import { KsefPlanCta } from "@/components/interactive/KsefPlanCta";
import { Chip } from "@/components/ui/Chip";
import { FilledPill } from "@/components/ui/FilledPill";
import { HotSaleIcon } from "@/components/ui/HotSaleIcon";
import { RichText } from "@/components/ui/RichText";

type KsefSwitchOfferProps = {
  offer: KsefSwitchOfferContent;
  contactHref: string;
  prefill?: string;
  variant: "compact" | "pricing";
};

export function KsefSwitchOffer({ offer, contactHref, prefill, variant }: KsefSwitchOfferProps) {
  if (variant === "compact") {
    return (
      <aside id="nexo-switch-banner" className="mx-auto w-full max-w-[1200px] px-6 pt-5" aria-label={offer.eyebrow}>
        <div className="ksef-surface ksef-surface-featured flex flex-col gap-4 p-5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between min-[700px]:gap-6 min-[700px]:p-6">
          <div className="min-w-0">
            <Chip tone="accent">{offer.eyebrow}</Chip>
            <p className="mt-3 text-[clamp(22px,3vw,32px)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
              <RichText>{offer.title}</RichText>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 min-[700px]:self-center">
            <FilledPill size="lg" as="a" href={offer.entryHref}>{offer.cta}</FilledPill>
            <a href={offer.conditionsHref} className="text-[14px] font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]">{offer.conditionsLinkLabel}</a>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section id="nexo-switch-pricing" className="ksef-surface ksef-surface-featured mt-6 flex flex-col gap-4 p-5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between min-[700px]:gap-6 min-[900px]:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <HotSaleIcon className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[22px] font-bold leading-[1.15] tracking-[-0.02em]"><RichText>{offer.pricingTitle}</RichText></h3>
          <p className="mt-2 text-[16px] leading-[1.5] text-ink-70"><RichText>{offer.pricingBody}</RichText></p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {prefill ? <KsefPlanCta label={offer.cta} prefill={prefill} /> : <FilledPill size="lg" as="a" href={contactHref}>{offer.cta}</FilledPill>}
        <a href={offer.conditionsHref} className="text-[14px] font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]">{offer.conditionsLinkLabel}</a>
      </div>
    </section>
  );
}
