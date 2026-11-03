// Single source of truth for the CSP + security-header values used by two consumers:
// scripts/gen-headers.mjs (writes out/.htaccess for the static export) and the anti-drift
// guard in src/lib/securityHeaders.test.ts. next.config.ts DUPLICATES these values inline
// on purpose (it must stay self-sufficient for Passenger boot) — the test asserts the two
// copies stay byte-identical, so any future edit to one copy without the other is red.
//
// GA4 (gtag.js) + Google Ads origins appear only when NEXT_PUBLIC_GA_ID is set: no id → no
// script → no CSP allowance (empty string disables GA completely, per .env.example).
// Calendly (assets + frame) is always allowed; Turnstile (challenges.cloudflare.com) always
// appears in script-src/frame-src because the contact form depends on it.

export function apiOriginFrom(raw) {
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function buildCsp({ apiOrigin, gaId }) {
  const apiSuffix = apiOrigin ? ` ${apiOrigin}` : "";

  const gaScriptSuffix = gaId
    ? " https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net"
    : "";
  const gaConnectSuffix = gaId
    ? " https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com" +
      " https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com" +
      " https://www.google.pl https://td.doubleclick.net"
    : "";
  const gaImgSuffix = gaId
    ? " https://www.googletagmanager.com https://*.google-analytics.com https://www.googleadservices.com" +
      " https://googleads.g.doubleclick.net https://www.google.com https://www.google.pl"
    : "";
  const gaFrameSuffix = gaId ? " https://td.doubleclick.net" : "";

  return (
    "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
    `img-src 'self' data: https://assets.calendly.com${gaImgSuffix}; ` +
    "style-src 'self' 'unsafe-inline' https://assets.calendly.com; " +
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://assets.calendly.com${gaScriptSuffix}; ` +
    `frame-src https://challenges.cloudflare.com https://calendly.com${gaFrameSuffix}; ` +
    `connect-src 'self'${apiSuffix}${gaConnectSuffix};`
  );
}

// DEMO_CSP is static (no env interpolation): mockups load Google Fonts, 'unsafe-eval' and
// unpkg.com, but never the API nor GA.
export const DEMO_CSP =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
  "img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; " +
  "connect-src 'self';";

// Main-site headers — order must match next.config.ts's "/:path*" entry byte-for-byte
// (src/lib/securityHeaders.test.ts asserts deep equality on the whole array).
export function buildSecurityHeaders({ apiOrigin, gaId }) {
  return [
    { key: "Content-Security-Policy", value: buildCsp({ apiOrigin, gaId }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}

// /demo/ override headers — order must match next.config.ts's "/demo/:path*" entry; listed
// AFTER "/:path*" there so the looser demo CSP wins (last-match-wins per Next docs).
export function buildDemoHeaders() {
  return [
    { key: "Content-Security-Policy", value: DEMO_CSP },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ];
}
