"use client";

import { FilledPill } from "@/components/ui/FilledPill";
import { useModalCtaClose } from "@/components/providers/ModalProvider";

// Filled CTA in a modal footer (case modal "Start a similar project ›") — always resolves to
// the CTA-close sequence (SPEC §6.5). No service selection anymore (the contact form has no
// service picker) — the CTA just closes the modal and hands off focus to the contact form.
// (The service modal, which also used this CTA, retired with the 2026-07-22 services-slider
// design — its tile CTA scrolls straight to #contact instead, never through ctaClose.)
export function ModalCta({ label }: { label: string }) {
  const ctaClose = useModalCtaClose();
  return (
    <FilledPill size="md" onClick={() => ctaClose()}>
      {label}
    </FilledPill>
  );
}
