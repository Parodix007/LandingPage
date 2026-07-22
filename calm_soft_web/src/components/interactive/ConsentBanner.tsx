"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { FilledPill } from "@/components/ui/FilledPill";
import { GhostPill } from "@/components/ui/GhostPill";
import { getStoredConsent, setConsent, onConsentReopen, type ConsentValue } from "@/lib/consent";

const consent = site.consent;

// Self-gating, non-modal banner (SPEC: 2026-07-22 GA4 + Consent Mode addendum). Rendered by
// layout.tsx only when getGaId() is truthy. Shows on mount when no decision is stored yet, and
// again whenever the footer's "Cookie settings" link (CookieSettingsButton) calls
// reopenConsentBanner(). Fixed position (no CLS) and never steals focus — no autofocus, no
// focus trap; the entrance is a pure CSS keyframe (fadeSlideUp, globals.css, transform/opacity
// only) so it needs no mount-timing JS and automatically respects prefers-reduced-motion via
// the existing global media query. z-[70]: above Nav's sticky z-50, below Modal's z-[100].
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  // Not a "derive state you could compute during render" case: this is a static export,
  // prerendered with no window/localStorage at build time, so the banner must render hidden on
  // both the server-rendered markup AND the client's first paint (matching hydration), then
  // decide real visibility only once mounted on the actual client — a lazy useState initializer
  // would run getStoredConsent() during the build-time prerender too and could disagree with
  // the client's post-hydration read, causing a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the effect.
    if (getStoredConsent() === null) setVisible(true);
    return onConsentReopen(() => setVisible(true));
  }, []);

  if (!visible) return null;

  function decide(value: ConsentValue) {
    setConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label={consent.settingsLabel}
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4 animate-[fadeSlideUp_300ms_ease-out]"
    >
      <div className="flex w-full max-w-[560px] flex-col gap-4 rounded-[var(--radius-card)] border border-border-08 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-[13.5px] leading-[1.5] text-ink-70">{consent.text}</p>
        <div className="flex shrink-0 items-center gap-3">
          <GhostPill tone="gray" size="sm" onClick={() => decide("denied")}>
            {consent.decline}
          </GhostPill>
          <FilledPill size="md" onClick={() => decide("granted")}>
            {consent.accept}
          </FilledPill>
        </div>
      </div>
    </div>
  );
}
