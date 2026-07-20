import type { Demo } from "@/content/types";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { TechStack } from "@/components/ui/TechStack";

// HANDOFF (2026-07-20 demo-detail-modal design doc) — renders inside the shared Modal shell
// (frozen `Modal`, SPEC §6.2-6.3), mirroring CaseModalContent's skeleton. No hooks here, so no
// 'use client' — it is still rendered fine from within the 'use client' ModalProvider tree.
// Binding contract: the element with id="modal-headline" is Modal's aria-labelledby target.
// No ModalCta footer (demos map to no ServiceId) — the footer is a plain external link instead.
export function DemoModalContent({ demo }: { demo: Demo }) {
  return (
    <div className="flex flex-col gap-[22px]">
      {/* pr-12 keeps the tag row clear of Modal's absolutely-positioned × button. */}
      <div className="flex flex-wrap items-center gap-2.5 pr-12">
        <Chip tone="accent">{demo.tag}</Chip>
      </div>

      <h2
        id="modal-headline"
        className="max-w-[860px] text-[clamp(22px,3.4vh,30px)] font-bold leading-[1.12] tracking-[-0.02em]"
      >
        {demo.tagline}
      </h2>

      {/* Screenshot of the live mockup. Sized to avoid CLS; lazy since it's below the fold / in a modal. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image */}
      <img
        src={demo.shot}
        alt={demo.shotAlt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        className="w-full rounded-[var(--radius-card)] border border-border-08"
      />

      <p className="text-[15px] leading-[1.6] text-ink-70">{demo.detail}</p>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">Key flows</div>
        <ul className="m-0 flex flex-wrap gap-2 p-0">
          {demo.features.map((f) => (
            <li
              key={f}
              className="list-none rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70"
            >
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {site.sections.demos.techLegend}
        </div>
        <TechStack />
      </div>

      {/* Filled CTA in the modal footer, matching FilledPill's size="md" rendering (SPEC token
          names: hit-44 + PILL_FOCUS ring + bg-accent/text-black) — kept a raw <a target="_blank"
          rel="noopener noreferrer"> rather than FilledPill/GhostPill, neither of which forward
          target/rel (same reason as Demos.tsx's card CTA). No ModalCta here: demos have no
          ServiceId to resolve into the CTA-close sequence. */}
      <div className="mt-1 flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[22px]">
        <a
          href={demo.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hit-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 py-3 text-[15px] font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]"
        >
          {site.sections.demos.liveCta}
        </a>
        <span className="text-[12.5px] text-ink-50">{site.modals.demoNote}</span>
      </div>
    </div>
  );
}
