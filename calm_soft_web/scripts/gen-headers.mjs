// Generates out/.htaccess (CSP + security headers + https redirect) for the Hostinger/
// LiteSpeed static export. Runs as `postbuild` — after `next build` writes out/.
//
// Loads env EXACTLY the same way scripts/assert-env.mjs and `next build` do, so the CSP this
// produces always matches the env the build actually used (anti-drift).
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvConfig(process.cwd(), false);

const outDir = resolve(process.cwd(), "out");
if (!existsSync(outDir)) {
  console.log(
    "[gen-headers] out/ nie istnieje — pomijam. `postbuild` ma sens tylko po pełnym " +
      "`next build` (static export); to nie jest błąd przy samodzielnym uruchomieniu."
  );
  process.exit(0);
}

const api = process.env.NEXT_PUBLIC_API_BASE_URL;
const gaId = process.env.NEXT_PUBLIC_GA_ID;

let apiOrigin = "";
if (api) {
  try {
    apiOrigin = new URL(api).origin;
  } catch {
    console.error(
      `[gen-headers] NEXT_PUBLIC_API_BASE_URL=${JSON.stringify(api)} nie jest poprawnym ` +
        "URL-em — pomijam w connect-src (assert-env powinien był zablokować taki build wcześniej)."
    );
  }
}

const apiSuffix = apiOrigin ? ` ${apiOrigin}` : "";

// GA4 (gtag.js) origins — added ONLY to this main CSP block (never /demo/'s), and only when
// NEXT_PUBLIC_GA_ID is actually set (mirrors layout.tsx's gaId gate, so CSP never allows an
// origin the page doesn't load from). script-src needs the loader script's origin; connect-src
// needs both the loader's origin (gtag.js itself makes a config-fetch request there) and the
// Measurement Protocol collect domains; img-src covers GA's no-JS/blocked-fetch image fallback.
//
// Since 2026-07-23 (Google Ads conversion hookup, EVENT_ADS_CONVERSION routed through this same
// combined GA4 tag — no separate AW- config/script) these suffixes also cover Google Ads
// conversion pings (googleadservices.com/googleads.g.doubleclick.net) and google.com/google.pl
// (ga-audiences remarketing pixel), plus the td.doubleclick.net frame gtag injects when
// ad_personalization is granted — per Google's tag-platform CSP guidance. Never added to the
// /demo/ block below.
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

// Calendly popup widget (lazy-loaded on click — CalendlyCta/lib/calendly.ts): script/style/img
// origins for the injected widget assets, frame-src for the popup iframe itself (served from
// calendly.com, not assets.calendly.com).
const csp =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
  `img-src 'self' data: https://assets.calendly.com${gaImgSuffix}; ` +
  "style-src 'self' 'unsafe-inline' https://assets.calendly.com; " +
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://assets.calendly.com${gaScriptSuffix}; ` +
  `frame-src https://challenges.cloudflare.com https://calendly.com${gaFrameSuffix}; ` +
  `connect-src 'self'${apiSuffix}${gaConnectSuffix};`;

console.log(`[gen-headers] CSP: ${csp}`);

const htaccessContent =
  `<IfModule mod_headers.c>\n` +
  `  Header always set Content-Security-Policy "${csp}"\n` +
  `  Header always set X-Content-Type-Options "nosniff"\n` +
  `  Header always set Referrer-Policy "strict-origin-when-cross-origin"\n` +
  `  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"\n` +
  `</IfModule>\n` +
  `\n` +
  `<IfModule mod_rewrite.c>\n` +
  `  RewriteEngine On\n` +
  `  RewriteCond %{HTTPS} off\n` +
  `  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]\n` +
  `</IfModule>\n`;

const htaccessPath = resolve(outDir, ".htaccess");
writeFileSync(htaccessPath, htaccessContent, "utf8");
console.log(`[gen-headers] Zapisano ${htaccessPath}`);

// out/demo/ = verbatim third-party-style clinic-website mockups (public/demo/**, never
// modified/relinted — see docs/superpowers/specs/2026-07-20-demo-section-design.md). They load
// Google Fonts, which the landing's own CSP above does not allow — rather than weakening the
// landing's script-src/style-src for the whole site, we scope a relaxed CSP + noindex to this
// one subdirectory only (per-directory .htaccess override, Apache/LiteSpeed semantics).
const demoDir = resolve(outDir, "demo");
if (existsSync(demoDir)) {
  const demoCsp =
    "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
    "img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; " +
    "connect-src 'self';";

  const demoHtaccessContent =
    `<IfModule mod_headers.c>\n` +
    `  Header always set Content-Security-Policy "${demoCsp}"\n` +
    `  Header always set X-Robots-Tag "noindex, nofollow"\n` +
    `</IfModule>\n`;

  const demoHtaccessPath = resolve(demoDir, ".htaccess");
  writeFileSync(demoHtaccessPath, demoHtaccessContent, "utf8");
  console.log(`[gen-headers] Zapisano ${demoHtaccessPath} (CSP zawężone do /demo/ — Google Fonts w makietach)`);
}
