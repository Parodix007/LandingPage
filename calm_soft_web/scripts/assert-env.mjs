// Named import fails here: @next/env is bundled CJS whose exports aren't
// statically detectable by Node's cjs-module-lexer, so use the default-export
// interop form Node itself suggests instead.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

// Load env EXACTLY like `next build` (production): .env.production, .env.local, .env + shell.
// .env.development applies ONLY to `next dev`.
loadEnvConfig(process.cwd(), false);

const api = process.env.NEXT_PUBLIC_API_BASE_URL;
const mock = process.env.NEXT_PUBLIC_INQUIRY_MOCK;
const site = process.env.NEXT_PUBLIC_SITE_URL;
const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function fail(message) {
  console.error(`[assert-env] BUILD ZABLOKOWANY: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[assert-env] UWAGA: ${message}`);
}

if (!api && !mock) {
  fail(
    "ustaw NEXT_PUBLIC_API_BASE_URL albo JAWNIE NEXT_PUBLIC_INQUIRY_MOCK=1|fail " +
      "(np. `npm run build:mock`). Mock nigdy nie jest cichym fallbackiem — chroni to " +
      "leady na produkcji."
  );
}

if (mock && mock !== "1" && mock !== "fail") {
  fail(
    `NEXT_PUBLIC_INQUIRY_MOCK=${JSON.stringify(mock)} jest nieprawidłowe — dozwolone ` +
      'wartości to wyłącznie "1" (sukces) lub "fail" (symulacja błędu). Literówka we ' +
      "fladze nie może przejść po cichu."
  );
}

if (api) {
  let parsed;
  try {
    parsed = new URL(api);
  } catch {
    fail(
      `NEXT_PUBLIC_API_BASE_URL=${JSON.stringify(api)} nie jest poprawnym URL-em. API base ` +
        "musi być samym originem https bez ścieżki/trailing-slash, np. https://api.calmsoft.pro."
    );
  }

  // Note: new URL("https://x/").pathname is also "/" — normalization makes pathname alone
  // unable to distinguish a trailing slash from a bare origin, so check the raw string too.
  const hasTrailingSlash = api.endsWith("/");
  if (
    parsed.protocol !== "https:" ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    hasTrailingSlash
  ) {
    fail(
      `NEXT_PUBLIC_API_BASE_URL=${JSON.stringify(api)} jest nieprawidłowy — API base musi być ` +
        "samym originem https bez ścieżki/trailing-slash/query/hash, np. https://api.calmsoft.pro " +
        "(nie https://api.calmsoft.pro/inquiries, nie z '/' na końcu)."
    );
  }

  if (!site) {
    fail(
      "build produkcyjny (NEXT_PUBLIC_API_BASE_URL ustawiony) wymaga NEXT_PUBLIC_SITE_URL — " +
        "inaczej canonical/OG wskażą placeholder."
    );
  }

  if (!turnstile) {
    fail(
      "build produkcyjny (NEXT_PUBLIC_API_BASE_URL ustawiony) wymaga " +
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY — bez publicznego site key widget Turnstile się nie " +
        "wyrenderuje i każdy realny submit dostanie 403 z API."
    );
  }

  if (mock) {
    warn(
      "ustawione są jednocześnie NEXT_PUBLIC_API_BASE_URL i NEXT_PUBLIC_INQUIRY_MOCK — mock " +
        "cicho wygrywa (submitInquiry nie uderzy w API). Sprawdź, czy to zamierzone przed " +
        "buildem produkcyjnym."
    );
  }

  // Cloudflare test site keys always start "1x0000"/"2x0000" (looser match than the exact
  // documented shape 1x00000000000000000000BB / 2x00000000000000000000BB — robust to Cloudflare
  // adding other test key variants with the same prefix convention).
  const looksLikeTestKey = Boolean(turnstile) && /^[12]x0{4,}/.test(turnstile);
  const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (looksLikeTestKey && !isLocalHost) {
    warn(
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${JSON.stringify(turnstile)} wygląda jak klucz testowy ` +
        "Cloudflare, a NEXT_PUBLIC_API_BASE_URL nie wskazuje na localhost — wysyłka klucza " +
        "testowego na produkcję wyłącza bramkę antyspamową (server-side siteverify zawsze " +
        "przepuści). Podmień na produkcyjny site key przed wdrożeniem."
    );
  }
}

if (!api && mock && !site) {
  warn(
    "build z mockiem bez NEXT_PUBLIC_SITE_URL — canonical/OG będą placeholderem. OK wyłącznie " +
      "dla buildów lokalnych/preview."
  );
}
