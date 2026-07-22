"use client";

import { site } from "@/content/site";
import { reopenConsentBanner } from "@/lib/consent";

// Tiny 'use client' leaf (SPEC: 2026-07-22 GA4 + Consent Mode addendum) — reopens the consent
// banner via the shared cs-consent-reopen event (lib/consent.ts). Rendered by Footer.tsx
// (server component) only when getGaId() is truthy, so a GA-less build ships no dead button.
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => reopenConsentBanner()}
      className="text-[12px] text-ink-50 hover:text-white"
    >
      {site.consent.settingsLabel}
    </button>
  );
}
