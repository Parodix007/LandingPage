"use client";

import { FilledPill } from "@/components/ui/FilledPill";
import type { ServiceId } from "@/content/types";
import { useModalCtaClose } from "@/components/providers/ModalProvider";

// Filled CTA in a modal footer (service modal "Start with this service ›" / case modal
// "Start a similar project ›") — always resolves to the CTA-close sequence (SPEC §6.5).
export function ModalCta({ serviceId, label }: { serviceId: ServiceId; label: string }) {
  const ctaClose = useModalCtaClose();
  return (
    <FilledPill size="md" onClick={() => ctaClose(serviceId)}>
      {label}
    </FilledPill>
  );
}
