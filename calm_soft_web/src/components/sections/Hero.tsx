import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { site } from "@/content/site";
import { getDemoBySlug } from "@/content/demos";
import { HERO_VARIANT } from "@/lib/config";
import { HeroDemoSlider } from "@/components/interactive/HeroDemoSlider";
import type { Demo } from "@/content/types";

// HANDOFF §2 / SPEC §6.8: 3 hero variants, single switch = HERO_VARIANT (lib/config.ts).
// Server component. Carries id="top" as the header wordmark's scroll target (Nav.tsx links
// to /#top). All copy from site.hero/site.eyebrow.

// site.hero.aurora.h1 carries a literal "\n" for its two-line break — render it as <br/>
// rather than relying on CSS wrapping (SPEC content contract).
function withLineBreaks(text: string) {
  return text.split("\n").map((line, i, all) => (
    <span key={i}>
      {line}
      {i < all.length - 1 ? <br /> : null}
    </span>
  ));
}

function HeroEyebrow() {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
      {site.eyebrow}
    </p>
  );
}

function HeroCodeVariant() {
  const { code } = site.hero;
  // Hero slider shows only the 3 `site.featuredDemoSlugs` (resolved by slug, never index — a
  // missing/renamed slug just drops silently), mirroring Demos.tsx's homepage curation; the
  // full 5-demo index lives at /demos/.
  const heroDemos = site.featuredDemoSlugs
    .map((slug) => getDemoBySlug(slug))
    .filter((d): d is Demo => d !== undefined);
  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,color-mix(in_oklch,var(--color-accent)_14%,transparent)_0%,transparent_70%)]"
      />
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-start gap-16 px-6 py-[100px] min-[900px]:grid-cols-[1fr_1.15fr]">
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
            <GhostPill tone="accent" size="lg" as="a" href="/#demo">
              {code.ctaDemos}
            </GhostPill>
            <GhostPill tone="accent" size="lg" as="a" href="/pricing/">
              {code.ctaPricing}
            </GhostPill>
          </div>
        </div>
        <HeroDemoSlider
          demos={heroDemos}
          label={code.demoLabel}
          langChip={site.sections.demos.langChip}
          flowsLabel={site.sections.demos.flowsLegend}
          techLegend={site.sections.demos.techLegend}
          liveCta={site.sections.demos.liveCta}
          demoNote={site.modals.demoNote}
          desktopNote={site.sections.demos.desktopNote}
        />
      </div>
    </div>
  );
}

function HeroAuroraVariant() {
  const { aurora } = site.hero;
  return (
    <div className="relative mx-auto w-full max-w-[900px] px-6 py-[100px] text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 animate-[glowDrift_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_28%,transparent)_0%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 animate-[glowDrift2_22s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent2)_20%,transparent)_0%,transparent_70%)]"
      />
      <HeroEyebrow />
      <h1 className="mx-auto mt-5 max-w-[820px] text-[clamp(56px,8vw,96px)] font-bold leading-[1.05] tracking-[-0.03em]">
        {withLineBreaks(aurora.h1)}
      </h1>
      <p className="mx-auto mt-6 max-w-[640px] text-[20px] leading-[1.5] text-ink-72">{aurora.lead}</p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <FilledPill size="lg" as="a" href="/#contact">
          {aurora.ctaPrimary}
        </FilledPill>
        <GhostPill tone="gray" size="lg" as="a" href="/#services">
          {aurora.ctaSecondary}
        </GhostPill>
      </div>
    </div>
  );
}

function HeroTypeVariant() {
  const { type } = site.hero;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-[100px]">
      <HeroEyebrow />
      <h1 className="mt-5 text-[clamp(60px,9vw,130px)] font-bold leading-[1.05] tracking-[-0.045em]">
        <span className="block text-ink-50">{type.line1}</span>
        <span className="block bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent2),var(--color-accent))] bg-[length:200%_100%] bg-clip-text text-transparent animate-[gradShift_8s_ease-in-out_infinite]">
          {type.line2}
        </span>
      </h1>
      <p className="mt-6 max-w-[640px] text-[20px] leading-[1.5] text-ink-72">{type.lead}</p>
      <div className="mt-9 flex flex-wrap items-center gap-4">
        <FilledPill size="lg" as="a" href="/#contact">
          {type.ctaPrimary}
        </FilledPill>
        {type.ctaSecondary ? (
          <GhostPill tone="accent" size="lg" as="a" href="/#process">
            {type.ctaSecondary}
          </GhostPill>
        ) : null}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" aria-label="Hero" className="flex min-h-[88vh] w-full items-center">
      {HERO_VARIANT === "code" ? <HeroCodeVariant /> : null}
      {HERO_VARIANT === "aurora" ? <HeroAuroraVariant /> : null}
      {HERO_VARIANT === "type" ? <HeroTypeVariant /> : null}
    </section>
  );
}
