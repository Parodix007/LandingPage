import { services } from "@/content/services";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Chip } from "@/components/ui/Chip";
import { FilledPill } from "@/components/ui/FilledPill";
import { Watermark } from "@/components/ui/Watermark";
import { CardActions } from "@/components/interactive/CardActions";
import type { Tone } from "@/content/types";

// HANDOFF §3: cards 1 & 4 (web, refactor → tone "a") glow/hover accent; cards 2 & 3
// (automation, core → tone "b") glow/hover accent2.
const TONE_TAG: Record<Tone, string> = {
  a: "text-accent",
  b: "text-accent2",
};

const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

const TONE_GLOW: Record<Tone, string> = {
  a: "[--glow-color:color-mix(in_oklch,var(--color-accent)_18%,transparent)]",
  b: "[--glow-color:color-mix(in_oklch,var(--color-accent2)_18%,transparent)]",
};

const TONE_HOVER_BORDER: Record<Tone, string> = {
  a: "hover:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent)_50%,transparent)]",
  b: "hover:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)] focus-within:border-[color-mix(in_oklch,var(--color-accent2)_50%,transparent)]",
};

// Server component (SPEC §16 client/server boundary) — the section renders static content;
// interactivity lives in the frozen `CardActions` client leaf.
export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading
        id="services-heading"
        line1={site.sections.services.line1}
        line2={site.sections.services.line2}
      />
      <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-[18px]">
        {services.map((s) => (
          <div
            key={s.id}
            className={`card-host relative flex flex-col gap-[18px] overflow-hidden rounded-[var(--radius-card)] border border-border-08 bg-surface p-[36px_30px] transition-[transform,border-color] duration-[350ms] hover:-translate-y-1 focus-within:-translate-y-1 ${TONE_HOVER_BORDER[s.tone]}`}
          >
            {/* Decorative glow circle — purely presentational, hidden from AT. */}
            <span
              aria-hidden="true"
              className={`card-glow -right-[120px] -top-[120px] h-[320px] w-[320px] ${TONE_GLOW[s.tone]}`}
            />
            <span aria-hidden="true" className="absolute right-[26px] top-6">
              <Watermark />
            </span>
            <p className={`text-[13px] font-semibold uppercase tracking-[0.12em] ${TONE_TAG[s.tone]}`}>
              {s.tag}
            </p>
            <h3 className="text-[24px] font-bold leading-[1.15] tracking-[-0.02em]">{s.headline}</h3>
            <p className="text-[15px] leading-[1.55] text-ink-70">{s.cardBody}</p>
            <div className="flex flex-wrap gap-[10px]">
              {s.chips.map((chip) => (
                <Chip key={chip} tone={TONE_CHIP[s.tone]}>
                  {chip}
                </Chip>
              ))}
            </div>
            <CardActions
              kind="service-card"
              serviceId={s.id}
              startLabel="Start with this service ›"
              learnLabel="Learn more ›"
            />
          </div>
        ))}
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
