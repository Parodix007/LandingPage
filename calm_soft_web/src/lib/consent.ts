// First-party consent flag for Google Analytics 4 (Consent Mode v2 "advanced" — gtag.js always
// loads per layout.tsx's bootstrap; gtag('consent', ...) is what actually gates data
// collection). Client-only: every window/localStorage access lives INSIDE a function —
// importing this module must be a pure no-op (mirrors turnstile.ts's conventions).
//
// Since the 2026-07-23 Google Ads conversion hookup, the single banner decision (accept/decline)
// drives all four Consent Mode v2 signals — analytics_storage plus the three ad signals
// (ad_storage/ad_user_data/ad_personalization) — there is no separate ads-specific opt-in.

export const CONSENT_KEY = "cs-consent-v1";
export type ConsentValue = "granted" | "denied";

const REOPEN_EVENT = "cs-consent-reopen";

/** Reads the stored consent decision. Returns null on first visit, for any unrecognized stored
 * value, or when localStorage throws (private browsing, disabled storage) — ConsentBanner
 * treats null as "not yet decided" and shows itself. */
export function getStoredConsent(): ConsentValue | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

/** Persists the decision and — if the gtag bootstrap in layout.tsx has already run —
 * updates Consent Mode live so the current session reflects the choice immediately. Updates
 * all four Consent Mode v2 signals (analytics + the three Ads conversion/remarketing signals)
 * from this one decision — there is no separate ads consent toggle. */
export function setConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Swallowed — a storage failure shouldn't block the visitor from dismissing the banner;
    // worst case it re-prompts next visit.
  }
  window.gtag?.("consent", "update", {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

/** Re-opens the (possibly already-decided) consent banner — e.g. the footer's "Cookie
 * settings" link (CookieSettingsButton). */
export function reopenConsentBanner(): void {
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
}

/** Subscribes to reopenConsentBanner() calls; returns an unsubscribe function. */
export function onConsentReopen(cb: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, cb);
  return () => window.removeEventListener(REOPEN_EVENT, cb);
}
