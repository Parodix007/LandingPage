import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GhostPill } from "@/components/ui/GhostPill";
import { RichText } from "@/components/ui/RichText";
import { HOVER_BORDER } from "@/components/ui/cardHover";
import { Watermark } from "@/components/ui/Watermark";

// Server component (SPEC §16 client/server boundary) — the section renders static content.
// Layout: photo left, branded tile right; short/long copy controlled by the `variant` prop.
// CTA points to /#contact (SPEC §6.1). No 'use client' — interactivity lives elsewhere.
type AboutVariant = "short" | "long";

interface AboutProps {
  variant?: AboutVariant;
  hideCta?: boolean;
}

export function About({ variant = "short", hideCta = false }: AboutProps) {
  const copy = site.about;
  const text = variant === "short" ? copy.short : copy.long;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto max-w-[1200px] px-6 py-[72px] min-[900px]:py-[110px]"
    >
      <SectionHeading id="about-heading" line1={copy.heading} line2="" />

      <div className="mt-10 grid grid-cols-1 items-start gap-10 min-[900px]:grid-cols-2 min-[900px]:gap-16">
        {/* Photo — left column */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] aspect-[35/48]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about-photo.webp"
            alt="calm_soft — projektant i developer systemów webowych"
            className="w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Branded tile — right column */}
        <div className={`card-host relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-10 bg-surface p-[56px_64px] ${HOVER_BORDER}`}>
          {/* Decorative glow + mono watermark — purely presentational, hidden from AT. */}
          <span
            aria-hidden="true"
            className="card-glow -right-40 -top-40 h-[460px] w-[460px] [--glow-color:color-mix(in_oklch,var(--color-accent)_16%,transparent)]"
          />
          <span aria-hidden="true" className="absolute right-[34px] top-7">
            <Watermark />
          </span>
          <div className="relative">
            {Array.isArray(text)
              ? text.map((p, i) => (
                  <p key={i} className="text-[16px] leading-[1.65] text-ink-70">
                    <RichText>{p}</RichText>
                  </p>
                ))
              : (
                  <p className="text-[16px] leading-[1.65] text-ink-70">
                    <RichText>{text}</RichText>
                  </p>
                )}
            {hideCta ? null : (
              <div className="mt-8">
                <GhostPill tone="accent" size="lg" as="a" href="/#contact">
                  {copy.cta}
                </GhostPill>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
