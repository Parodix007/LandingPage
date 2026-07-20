"use client";

import type { ServiceId } from "@/content/types";
import { GhostPill } from "@/components/ui/GhostPill";
import { useInquiry } from "@/components/providers/InquiryProvider";
import { useModal } from "@/components/providers/ModalProvider";

export type CardActionsProps =
  | { kind: "service-card"; serviceId: ServiceId; startLabel: string; learnLabel: string }
  | { kind: "case-card"; caseSlug: string; readLabel: string; ariaLabel?: string }
  | { kind: "demo-card"; demoSlug: string; readLabel: string; ariaLabel?: string };

// SPEC §6.4 — stretched-button pattern (zero nested interactives). The card itself is a
// non-interactive `.card-host` container rendered by the section; whichever CTA below is
// `stretched` covers the whole card via `.pill-stretched::after { inset: 0 }`. Any sibling
// CTA sits above it via `position: relative` + a higher `z-index`, so its clicks never reach
// the stretched button underneath — `stopPropagation` is never needed.
export function CardActions(props: CardActionsProps) {
  const { selectService, requestContactScroll, focusSelectedServiceRadio } = useInquiry();
  const { openServiceModal, openCaseModal, openDemoModal } = useModal();

  if (props.kind === "case-card") {
    return (
      <GhostPill
        tone="accent"
        stretched
        aria-label={props.ariaLabel}
        onClick={() => openCaseModal(props.caseSlug)}
      >
        {props.readLabel}
      </GhostPill>
    );
  }

  if (props.kind === "demo-card") {
    return (
      <GhostPill
        tone="accent"
        stretched
        aria-label={props.ariaLabel}
        onClick={() => openDemoModal(props.demoSlug)}
      >
        {props.readLabel}
      </GhostPill>
    );
  }

  const { serviceId, startLabel, learnLabel } = props;

  const start = () => {
    selectService(serviceId);
    requestContactScroll();
    requestAnimationFrame(() => focusSelectedServiceRadio());
  };

  return (
    <div className="mt-auto flex items-center pt-2">
      {/* Sibling, NOT part of the stretched hit area — relative + z-index keeps its clicks
          from ever reaching the stretched "Learn more" pill beneath it. */}
      <span className="relative z-10">
        <GhostPill tone="accent" flush onClick={start}>
          {startLabel}
        </GhostPill>
      </span>
      <GhostPill tone="gray" stretched onClick={() => openServiceModal(serviceId)}>
        {learnLabel}
      </GhostPill>
    </div>
  );
}
