// Postprocess eksportu statycznego po `next build` (kolejność wg konwencji repo):
// 1) scripts/gen-headers.mjs   — out/.htaccess (CSP + nagłówki bezpieczeństwa)
// 2) scripts/gen-font-preload.mjs — preload fontów self-hosted w out/**/*.html (brief #4a;
//    Next 16 nie emituje preload dla fontów CSS-variable — discoveries 2026-11-06)
// Uruchamiany jako `npm run postbuild`. Oba kroki są idempotentne i same pomikają gdy out/ nie istnieje.
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const here = import.meta.dirname;
for (const step of ["gen-headers.mjs", "gen-font-preload.mjs"]) {
  execFileSync(process.execPath, [join(here, step)], { stdio: "inherit" });
}
