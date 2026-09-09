"use client";

import { useInquiry } from "@/components/providers/InquiryProvider";
import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";

export type KsefPlanCtaProps = {
  label: string;
  prefill: string;
  variant?: "filled" | "ghost";
  className?: string;
};

// 'use client' leaf (2026-09-09 ksef-product-pages design, "Krok 3") — a plan/savings CTA on the
// KSeF product pages. Unlike CalendlyCta (which navigates to an external URL), this button stays
// on-page: it hands the plan's `prefill` text to the contact form, scrolls to #contact, then
// focuses the form so the visitor can just start typing. Order matters — the form must have the
// prefilled text in place before scroll/focus land the visitor on it.
export function KsefPlanCta({ label, prefill, variant = "filled", className }: KsefPlanCtaProps) {
  const { prefillContactMessage, requestContactScroll, focusContactField } = useInquiry();

  function handleClick() {
    prefillContactMessage(prefill);
    requestContactScroll();
    requestAnimationFrame(() => focusContactField());
  }

  if (variant === "ghost") {
    return (
      <GhostPill tone="accent" size="sm" onClick={handleClick}>
        {label}
      </GhostPill>
    );
  }

  return (
    <FilledPill size="lg" onClick={handleClick} className={className}>
      {label}
    </FilledPill>
  );
}
