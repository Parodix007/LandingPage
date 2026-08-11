// `output: "export"` stays for local static-export builds (`npm run build`, `npm run preview`,
// Lighthouse). Production on Hostinger, however, is NOT a static export despite this flag:
// Hostinger's build pipeline forces a server build, `out/` never exists there, so `postbuild`
// (scripts/gen-headers.mjs) never writes out/.htaccess. Next still reads THIS file at runtime in
// that mode — proof: `GET /pricing` 308-redirects to `/pricing/`, i.e. `trailingSlash: true` is
// honoured in production — so `headers()` below is the ONLY place security headers reach
// production today.
//
// Confirmed in node_modules/next/dist/esm/server/config.js:315 — "output: export" together with
// "headers" produces a Log.warn, not a build error, so the two can coexist without branching
// config. Expect that warning in the build log after this change; it is correct, do not silence
// it.
//
// `server.js` (Passenger's PassengerStartupFile) imports this file at production process
// startup, so it MUST be self-sufficient: it imports NOTHING beyond the `NextConfig` type from
// `next`. If it imported scripts/csp.mjs — or anything else Hostinger's build pipeline might not
// copy into the runtime directory — a missing module would crash the app at boot. Every header
// value below is therefore duplicated inline from scripts/csp.mjs, not imported.
// src/lib/securityHeaders.test.ts asserts the two copies stay byte-identical, turning any future
// drift into a red test instead of a silent divergence.
//
// Confirmed in node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
// headers.md, "Header Overriding Behavior": when two header entries match the same path and set
// the same key, the LAST matching entry in the returned array wins. `/demo/:path*` also matches
// `/:path*`, so the `/demo/:path*` entry (looser mockup CSP) is listed AFTER `/:path*` (main
// CSP) below — reversing the order would make the main CSP win on /demo/* and break the mockups
// (Google Fonts, unpkg.com, 'unsafe-eval').
//
// Known gap: the `.htaccess` HTTPS-redirect (mod_rewrite RewriteCond %{HTTPS} off) has no
// `headers()` equivalent, and it is not worth faking via `redirects()` here — Hostinger only
// ever serves this app over HTTPS in practice.
import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const gaId = process.env.NEXT_PUBLIC_GA_ID;

// Mirrors scripts/csp.mjs's apiOriginFrom(): "" when apiBaseUrl is empty or not a valid URL,
// never throws. Inlined (not imported) per the constraint above.
let apiOrigin = "";
if (apiBaseUrl) {
  try {
    apiOrigin = new URL(apiBaseUrl).origin;
  } catch {
    apiOrigin = "";
  }
}
const apiSuffix = apiOrigin ? ` ${apiOrigin}` : "";

// GA4 (gtag.js) + Google Ads conversion origins — see scripts/csp.mjs's buildCsp() for the full
// rationale (kept word-for-word in sync by src/lib/securityHeaders.test.ts).
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

// Main-site CSP — must stay byte-identical to scripts/csp.mjs's buildCsp() output.
const csp =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
  `img-src 'self' data: https://assets.calendly.com${gaImgSuffix}; ` +
  "style-src 'self' 'unsafe-inline' https://assets.calendly.com; " +
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://assets.calendly.com${gaScriptSuffix}; ` +
  `frame-src https://challenges.cloudflare.com https://calendly.com${gaFrameSuffix}; ` +
  `connect-src 'self'${apiSuffix}${gaConnectSuffix};`;

// /demo/ CSP override — must stay byte-identical to scripts/csp.mjs's DEMO_CSP.
const demoCsp =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
  "img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; " +
  "connect-src 'self';";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Listed AFTER "/:path*" on purpose — see the Header Overriding Behavior comment above.
        source: "/demo/:path*",
        headers: [
          { key: "Content-Security-Policy", value: demoCsp },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
