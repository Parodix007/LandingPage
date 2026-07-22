"use client";

import { GhostPill } from "@/components/ui/GhostPill";
import { useModal } from "@/components/providers/ModalProvider";

export type CardActionsProps =
  | { kind: "case-card"; caseSlug: string; readLabel: string; ariaLabel?: string }
  | { kind: "demo-card"; demoSlug: string; readLabel: string; ariaLabel?: string };

// SPEC §6.4 — stretched-button pattern (zero nested interactives). The card itself is a
// non-interactive `.card-host` container rendered by the section; whichever CTA below is
// `stretched` covers the whole card via `.pill-stretched::after { inset: 0 }`. Any sibling
// CTA sits above it via `position: relative` + a higher `z-index`, so its clicks never reach
// the stretched button underneath — `stopPropagation` is never needed. (The former
// "service-card" arm — start/learn split, GhostPill "flush" + "stretched" siblings — retired
// with the service modal; see docs/superpowers/specs/2026-07-22-services-slider-design.md.
// Case/demo cards are the only remaining consumers of the stretched-button pattern here.)
export function CardActions(props: CardActionsProps) {
  const { openCaseModal, openDemoModal } = useModal();

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
