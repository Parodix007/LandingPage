"use client";

import type { MouseEvent } from "react";
import { CALENDLY_URL } from "@/lib/config";
import { FilledPill } from "@/components/ui/FilledPill";
import { PILL_FOCUS } from "@/components/ui/pillBase";
import { openCalendlyPopup } from "@/lib/calendly";
import { track, EVENT_CALENDLY } from "@/lib/analytics";

export type CalendlyCtaVariant = "filled" | "link";

export type CalendlyCtaProps = {
  label: string;
  variant: CalendlyCtaVariant;
  ariaLabel?: string;
};

// Styled like the Contact.tsx email link (text-accent hover:text-white), plus PILL_FOCUS for a
// visible keyboard-focus indicator (SPEC §11.2) — this is a real onClick control, not a plain
// mailto navigation link.
const LINK_CLASSES = `${PILL_FOCUS} rounded-[var(--radius-input)] text-[17px] font-medium text-accent hover:text-white`;

// 'use client' leaf (server sections render it as a child) — owns the Calendly popup's lazy
// load + fallback. The script loads on first click, not at mount (SPEC 2026-07-20 reorder
// doc). With JS disabled, the anchor still navigates to Calendly directly.
export function CalendlyCta({ label, variant, ariaLabel }: CalendlyCtaProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    track(EVENT_CALENDLY);
    openCalendlyPopup(CALENDLY_URL).catch(() => {
      window.open(CALENDLY_URL, "_blank", "noopener");
    });
  }

  if (variant === "filled") {
    return (
      <FilledPill
        size="lg"
        as="a"
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        onClick={handleClick}
      >
        {label}
      </FilledPill>
    );
  }

  return <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} onClick={handleClick} className={LINK_CLASSES}>{label}</a>;
}
