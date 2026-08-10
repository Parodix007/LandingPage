// Generates out/.htaccess (CSP + security headers + https redirect) for the Hostinger/
// LiteSpeed static export. Runs as `postbuild` — after `next build` writes out/.
//
// Loads env EXACTLY the same way scripts/assert-env.mjs and `next build` do, so the CSP this
// produces always matches the env the build actually used (anti-drift).
//
// NOTE: production on calmsoft.pro does NOT consume this file's output — Hostinger runs the app
// as a Node process (Passenger), out/ never exists there, so this postbuild step never runs
// against a real build. See the comment at the top of next.config.ts: `headers()` there is what
// actually reaches production, and duplicates (not imports) the values built here. This script
// remains the path for genuinely static builds — local `npm run preview`, Lighthouse, and any
// future static deployment.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { apiOriginFrom, buildDemoHeaders, buildDemoMwprojectHeaders, buildSecurityHeaders } from "./csp.mjs";

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

const apiOrigin = apiOriginFrom(api);
if (api && !apiOrigin) {
  console.error(
    `[gen-headers] NEXT_PUBLIC_API_BASE_URL=${JSON.stringify(api)} nie jest poprawnym ` +
      "URL-em — pomijam w connect-src (assert-env powinien był zablokować taki build wcześniej)."
  );
}

const securityHeaders = buildSecurityHeaders({ apiOrigin, gaId });
const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy").value;

console.log(`[gen-headers] CSP: ${csp}`);

const headerLines = securityHeaders.map((h) => `  Header always set ${h.key} "${h.value}"\n`).join("");

const htaccessContent =
  `<IfModule mod_headers.c>\n` +
  headerLines +
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

const demoDir = resolve(outDir, "demo");
if (existsSync(demoDir)) {
  const demoHeaders = buildDemoHeaders();
  const demoHeaderLines = demoHeaders.map((h) => `  Header always set ${h.key} "${h.value}"\n`).join("");

  const demoHtaccessContent = `<IfModule mod_headers.c>\n` + demoHeaderLines + `</IfModule>\n`;

  const demoHtaccessPath = resolve(demoDir, ".htaccess");
  writeFileSync(demoHtaccessPath, demoHtaccessContent, "utf8");
  console.log(`[gen-headers] Zapisano ${demoHtaccessPath} (CSP zawężone do /demo/ — Google Fonts w makietach)`);
}

const demoMwprojectDir = resolve(outDir, "demo", "mwproject");
if (existsSync(demoMwprojectDir)) {
  const demoMwprojectHeaders = buildDemoMwprojectHeaders();
  const demoMwprojectHeaderLines = demoMwprojectHeaders
    .map((h) => `  Header always set ${h.key} "${h.value}"\n`)
    .join("");

  const demoMwprojectHtaccessContent = `<IfModule mod_headers.c>\n` + demoMwprojectHeaderLines + `</IfModule>\n`;

  const demoMwprojectHtaccessPath = resolve(demoMwprojectDir, ".htaccess");
  writeFileSync(demoMwprojectHtaccessPath, demoMwprojectHtaccessContent, "utf8");
  console.log(
    `[gen-headers] Zapisano ${demoMwprojectHtaccessPath} (CSP zawężone do /demo/mwproject/ — blob: dla samorozpakowującej się paczki)`
  );
}
