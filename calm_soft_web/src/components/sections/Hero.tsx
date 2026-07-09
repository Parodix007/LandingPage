import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { site } from "@/content/site";
import type { HeroCodeToken, HeroTitleSegment } from "@/content/types";
import { HERO_VARIANT } from "@/lib/config";

// HANDOFF §2 / SPEC §6.8: 3 hero variants, single switch = HERO_VARIANT (lib/config.ts).
// Server component, no id (Hero is not an anchor target). All copy from site.hero/site.eyebrow.

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

// kind→color mapping for the fake-code window tokens (HANDOFF §2 "code" variant).
const TOKEN_COLOR: Record<HeroCodeToken["kind"], string> = {
  kw: "text-[color:var(--color-syntax-kw)]",
  fn: "text-[color:var(--color-syntax-fn)]",
  str: "text-[color:var(--color-syntax-str)]",
  ok: "text-accent",
  plain: "text-ink-72",
};

// mockup title bar: brand text white+semibold, the "_" accent green, the filename faded.
const TITLE_TONE: Record<HeroTitleSegment["tone"], string> = {
  brand: "font-semibold text-ink",
  accent: "font-semibold text-accent",
  muted: "text-ink-deco-45",
};

function HeroCodeWindow() {
  const { window: win } = site.hero.code;
  return (
    <div
      aria-hidden="true"
      className="w-full justify-self-center animate-[floatY_7s_ease-in-out_infinite] overflow-hidden rounded-2xl border border-border-10 bg-[rgba(28,28,30,0.9)] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_60px_color-mix(in_oklch,var(--color-accent)_12%,transparent)]"
    >
      <div className="flex items-center gap-2 border-b border-border-10 px-5 py-3.5">
        <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[12.5px]">
          {win.title.map((seg, i) => (
            <span key={i} className={TITLE_TONE[seg.tone]}>
              {seg.text}
            </span>
          ))}
        </span>
      </div>
      <div className="whitespace-pre px-6 py-5 font-mono text-[13.5px] leading-[1.75]">
        {win.lines.map((line, i) => (
          <div key={i}>
            {line.map((token, j) => (
              <span key={j} className={TOKEN_COLOR[token.kind]}>
                {token.text}
              </span>
            ))}
          </div>
        ))}
        <span className="mt-1 inline-block h-4 w-2 animate-[blink_1.1s_step-end_infinite] bg-accent" />
      </div>
    </div>
  );
}

function HeroCodeVariant() {
  const { code } = site.hero;
  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,color-mix(in_oklch,var(--color-accent)_14%,transparent)_0%,transparent_70%)]"
      />
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-[100px] min-[900px]:grid-cols-[1.1fr_1fr]">
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
            <GhostPill tone="accent" size="lg" as="a" href="/#process">
              {code.ctaSecondary}
            </GhostPill>
          </div>
        </div>
        <HeroCodeWindow />
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
    <section aria-label="Hero" className="flex min-h-[88vh] w-full items-center">
      {HERO_VARIANT === "code" ? <HeroCodeVariant /> : null}
      {HERO_VARIANT === "aurora" ? <HeroAuroraVariant /> : null}
      {HERO_VARIANT === "type" ? <HeroTypeVariant /> : null}
    </section>
  );
}
