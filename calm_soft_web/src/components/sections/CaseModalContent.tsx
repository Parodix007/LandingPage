import type { CaseStudy, Tone } from "@/content/types";
import { site } from "@/content/site";
import { Chip } from "@/components/ui/Chip";
import { ModalCta } from "@/components/interactive/ModalCta";

const TONE_CHIP: Record<Tone, "accent" | "accent2"> = {
  a: "accent",
  b: "accent2",
};

// HANDOFF §7 — renders inside the shared Modal shell (frozen `Modal`, SPEC §6.2-6.3). No
// hooks here, so no 'use client' (mirrors the ServiceModalContent skeleton) — it is still
// rendered fine from within the 'use client' ModalProvider tree. Binding contract: the
// element with id="modal-headline" is Modal's aria-labelledby target.
export function CaseModalContent({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="flex flex-col gap-[22px]">
      {/* pr-12 keeps the tag/client row clear of Modal's absolutely-positioned × button. */}
      <div className="flex flex-wrap items-center gap-2.5 pr-12">
        <Chip tone={TONE_CHIP[caseStudy.tone]}>{caseStudy.tag}</Chip>
        <span className="text-[13px] text-ink-50">{caseStudy.client}</span>
      </div>

      <h2
        id="modal-headline"
        className="max-w-[860px] text-[clamp(22px,3.4vh,30px)] font-bold leading-[1.12] tracking-[-0.02em]"
      >
        {caseStudy.headline}
      </h2>

      <div className="flex flex-wrap gap-11">
        <div className="flex flex-col gap-1">
          <div className="text-[clamp(30px,5vh,40px)] font-bold leading-none tracking-[-0.03em] text-accent">
            {caseStudy.m1v}
          </div>
          <div className="text-[13.5px] text-ink-55">{caseStudy.m1l}</div>
        </div>
        {caseStudy.m2v ? (
          <div className="flex flex-col gap-1">
            <div className="text-[clamp(30px,5vh,40px)] font-bold leading-none tracking-[-0.03em] text-white">
              {caseStudy.m2v}
            </div>
            <div className="text-[13.5px] text-ink-55">{caseStudy.m2l}</div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] items-start gap-[clamp(16px,2.5vw,30px)]">
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
            Challenge
          </div>
          <p className="text-[14px] leading-[1.55] text-ink-70">{caseStudy.challenge}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
            Approach
          </div>
          <p className="text-[14px] leading-[1.55] text-ink-70">{caseStudy.approach}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
            Results
          </div>
          <p className="text-[14px] leading-[1.55] text-ink-70">{caseStudy.results}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {caseStudy.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-[var(--radius-pill)] border border-border-10 bg-white/[0.06] px-[13px] py-[6px] text-[12.5px] text-ink-70"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-[18px] border-t border-border-08 pt-[22px]">
        <ModalCta serviceId={caseStudy.serviceId} label="Start a similar project ›" />
        <span className="text-[12.5px] text-ink-50">{site.modals.caseNote}</span>
      </div>
    </div>
  );
}
