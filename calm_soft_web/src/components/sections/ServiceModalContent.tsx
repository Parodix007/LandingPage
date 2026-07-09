"use client";

import type { Service, Tone } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { GhostPill } from "@/components/ui/GhostPill";
import { ModalCta } from "@/components/interactive/ModalCta";
import { useModal } from "@/components/providers/ModalProvider";
import { getCaseBySlug } from "@/content/cases";
import { site } from "@/content/site";

const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

// HANDOFF §4 grid 1 ("when it's the right call" / "what we deliver") and grid 2
// ("how we run it" / "proof from our work") share the same auto-fit column layout.
const GRID_COLS =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-[clamp(18px,2.5vw,34px)]";
const SECTION_LABEL = "text-[13px] font-semibold uppercase tracking-[0.12em] text-accent";

// 'use client' — the mini related-case cards call useModal().openCaseModal to switch the
// modal content in place (SPEC §6.2/§6.3); binding id="modal-headline" is Modal's
// aria-labelledby target.
export function ServiceModalContent({ service }: { service: Service }) {
  const { openCaseModal } = useModal();
  const relatedCases = service.relatedSlugs
    .map((slug) => getCaseBySlug(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="flex flex-col gap-[clamp(14px,2.4vh,22px)]">
      <div className="flex flex-wrap items-center gap-[10px] pr-12">
        <Chip tone={TONE_CHIP[service.tone]}>{service.tag}</Chip>
        <span className="text-[13px] text-ink-50">Service overview</span>
      </div>

      <h2
        id="modal-headline"
        className="max-w-[860px] text-[clamp(22px,3.4vh,30px)] font-bold leading-[1.12] tracking-[-0.02em]"
      >
        {service.headline}
      </h2>

      <p className="max-w-[860px] text-[15px] leading-[1.55] text-ink-70">{service.intro}</p>

      <div className={GRID_COLS}>
        <div className="flex flex-col gap-3">
          <p className={SECTION_LABEL}>{"When it's the right call"}</p>
          <ul className="flex flex-col gap-[9px]">
            {service.fit.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-[14px] leading-[1.5] text-accent">
                  ✓
                </span>
                <span className="text-[14px] leading-[1.5] text-ink-70">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-[14px]">
          <p className={SECTION_LABEL}>What we deliver</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-[12px_20px]">
            {service.deliver.map((d) => (
              <div key={d.n} className="flex flex-col gap-[3px]">
                <p className="text-[14.5px] font-semibold text-ink">{d.n}</p>
                <p className="text-[13px] leading-[1.45] text-ink-60">{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={GRID_COLS}>
        <div className="flex flex-col gap-2">
          <p className={SECTION_LABEL}>How we run it</p>
          <p className="text-[14px] leading-[1.55] text-ink-70">{service.approach}</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className={SECTION_LABEL}>Proof from our work</p>
          <div className="flex flex-wrap gap-3">
            {relatedCases.map((c) => (
              <div
                key={c.slug}
                className="card-host relative flex flex-[1_1_240px] flex-col gap-[6px] rounded-[var(--radius-mini)] border border-border-10 bg-white/[0.04] p-[18px_20px] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--color-accent)_45%,transparent)]"
              >
                <p className="text-[26px] font-bold leading-none tracking-[-0.03em] text-accent">
                  {c.m1v}
                </p>
                <p className="text-[14px] font-semibold leading-[1.35] text-ink">{c.headline}</p>
                <GhostPill
                  tone="accent"
                  size="xs"
                  stretched
                  aria-label={`Read the story: ${c.client}`}
                  onClick={() => openCaseModal(c.slug)}
                >
                  Read the story ›
                </GhostPill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[22px]">
        <ModalCta serviceId={service.id} label="Start with this service ›" />
        <span className="text-[12.5px] text-ink-50">{site.modals.serviceNote}</span>
      </div>
    </div>
  );
}
