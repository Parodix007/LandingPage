import type { Demo } from "@/content/types";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { TechStack } from "@/components/ui/TechStack";
import { WarningNote } from "@/components/ui/WarningNote";
import { DemoLogo } from "@/components/ui/DemoLogo";

// Shared "chip" treatment for the per-demo language note (2026-07-22 pl-copy handoff §6) —
// mirrors the pill styling already used for the features/tags lists below (ui/ is frozen, so
// this stays a local constant rather than a new shared primitive).
const LANG_CHIP_CLASS =
  "inline-flex items-center rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70";

// HANDOFF (2026-07-20 demo-detail-modal design doc) — renders inside the shared Modal shell
// (frozen `Modal`, SPEC §6.2-6.3), mirroring CaseModalContent's skeleton. No hooks here, so no
// 'use client' — it is still rendered fine from within the 'use client' ModalProvider tree.
// Binding contract: the element with id="modal-headline" is Modal's aria-labelledby target.
// No ModalCta footer (demos map to no ServiceId) — the footer is a plain external link instead.
//
// 2026-07-23 hero-demo-detail-slider design — no-scroll fit: the 1440×900 screenshot was tall
// enough to push this content past Modal's `max-h-[92vh] overflow-y-auto` safety net at typical
// desktop viewports, producing a visible scrollbar. A first pass capped the screenshot at
// `min(38vh,420px)`, which measured out to still overflow at 1280×800 (dialog scrollHeight 892
// vs clientHeight 734, worst case = cadence/airlift, whose longer feature-pill text wraps to a
// second row) — so the cap is now BUDGET-based rather than a flat viewport fraction:
// `max-h-[clamp(120px,calc(92vh-620px),420px)]`. 92vh mirrors Modal's own max-height; ~620px is
// a measured estimate of everything else in this component at tight gaps (paddings + chip row +
// tagline + detail paragraph + flows/tech blocks + footer, worst-case demo) — so
// `92vh - 620px` is roughly "whatever's left for the image" at the current viewport height, the
// clamp floor keeps a usable preview strip on short viewports (where the budget goes negative),
// and the ceiling caps it on tall ones. Measured at 1280×800 with the worst-case demo
// (cadence/airlift): this leaves ~50px of margin under Modal's 734px clientHeight after
// accounting for the tightened gap/footer padding below. The wrapper gap/footer padding are
// viewport-relative clamps instead of fixed px for the same reason. Modal.tsx itself is
// untouched — its overflow-y-auto stays as the safety net, not the primary fix.
export function DemoModalContent({ demo }: { demo: Demo }) {
  return (
    <div className="flex flex-col gap-[clamp(8px,1.6vh,20px)]">
      {/* pr-12 keeps the tag row clear of Modal's absolutely-positioned × button. Language chip
          (site.sections.demos.langChip) only for demos whose interface is in English — see
          Demo.uiLang (2026-07-22 pl-copy handoff §6). */}
      <div className="flex flex-wrap items-center gap-2.5 pr-12">
        <Chip tone="accent">{demo.tag}</Chip>
        {demo.uiLang === "en" && (
          <span className={LANG_CHIP_CLASS}>{site.sections.demos.langChip}</span>
        )}
      </div>

      {/* Brand lockup for demos with their own visual identity (cadence/airlift) — purely
          decorative alongside the tagline headline below; the h2 stays the modal's
          aria-labelledby target regardless (2026-07-22 pl-copy handoff §7). */}
      {demo.logoId && <DemoLogo logo={demo.logoId} instanceId="modal" className="h-7 w-auto" />}

      <h2
        id="modal-headline"
        className="max-w-[860px] text-[clamp(22px,3.4vh,30px)] font-bold leading-[1.12] tracking-[-0.02em]"
      >
        {demo.tagline}
      </h2>

      {/* Screenshot of the live mockup. Sized to avoid CLS; lazy since it's below the fold / in a
          modal. Capped height + cropped from the top (object-cover/object-top) — see the
          no-scroll fit note above (budget-based clamp, not a flat viewport fraction). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image */}
      <img
        src={demo.shot}
        alt={demo.shotAlt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        className="max-h-[clamp(120px,calc(92vh-620px),420px)] w-full rounded-[var(--radius-card)] border border-border-08 object-cover object-top"
      />

      <p className="text-[15px] leading-[1.6] text-ink-70">{demo.detail}</p>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {site.sections.demos.flowsLegend}
        </div>
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
      <div className="mt-1 flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[clamp(10px,1.5vh,20px)]">
        <a
          href={demo.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hit-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-accent px-7 py-3 text-[15px] font-semibold leading-none text-black transition-[filter] duration-[250ms] hover:brightness-[1.15]"
        >
          {site.sections.demos.liveCta}
        </a>
        {/* Desktop-only staff panels (HealthLab, Merdi Panel) stack a second line, styled as a
            warning, under the best-practices note — see docs/superpowers/specs/
            2026-07-21-desktop-only-demo-note-design.md ("Warning treatment" revision).
            site.modals.demoNote keeps its existing 12.5px muted styling — the warning is
            intentionally the louder of the two. */}
        <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-50">
          <span>{site.modals.demoNote}</span>
          {demo.desktopOnly && <WarningNote>{site.sections.demos.desktopNote}</WarningNote>}
        </div>
      </div>
    </div>
  );
}
