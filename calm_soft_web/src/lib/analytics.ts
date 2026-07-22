// Google Analytics 4 (gtag.js) + Consent Mode v2 "advanced" (SPEC: 2026-07-22 GA4 + Consent
// Mode addendum). GA is entirely env-gated: with NEXT_PUBLIC_GA_ID unset, getGaId() returns
// null, layout.tsx renders no script and no ConsentBanner, and gen-headers.mjs adds no CSP
// origins — a GA-less build ships zero GA surface area.
//
// Single declaration site for window.gtag/window.dataLayer (consent.ts and layout.tsx's inline
// bootstrap both rely on this same global augmentation).
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const EVENT_LEAD = "generate_lead";
export const EVENT_LEAD_DETAILS = "lead_details_submitted";
export const EVENT_CALENDLY = "calendly_open";

/** Public GA4 measurement ID (build-time, inlined) — not a secret. Returns null when GA is
 * fully off, the single condition every GA-touching call site (layout.tsx, Footer.tsx) gates on. */
export function getGaId(): string | null {
  return process.env.NEXT_PUBLIC_GA_ID || null;
}

/**
 * Fires a GA4 event via window.gtag. No-ops server-side (SSR/build) and when gtag hasn't
 * loaded (GA off, script blocked, or the page hasn't hit the bootstrap yet) — Consent Mode
 * itself is responsible for withholding/cookieless-pinging denied-consent hits once gtag does
 * exist, so track() never needs to check consent directly.
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
