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
const analyticsSrc = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;

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

// Analytics script only ever renders when BOTH vars are set (src/lib/analytics.ts) — mirror
// that condition here so CSP never allows an origin the page doesn't actually load from.
let analyticsOrigin = "";
if (analyticsSrc && analyticsDomain) {
  try {
    analyticsOrigin = new URL(analyticsSrc).origin;
  } catch {
    console.error(
      `[gen-headers] NEXT_PUBLIC_ANALYTICS_SRC=${JSON.stringify(analyticsSrc)} nie jest ` +
        "poprawnym URL-em — pomijam w CSP."
    );
  }
}

const analyticsSuffix = analyticsOrigin ? ` ${analyticsOrigin}` : "";
const apiSuffix = apiOrigin ? ` ${apiOrigin}` : "";

const csp =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
  "img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${analyticsSuffix}; ` +
  "frame-src https://challenges.cloudflare.com; " +
  `connect-src 'self'${apiSuffix}${analyticsSuffix};`;

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
