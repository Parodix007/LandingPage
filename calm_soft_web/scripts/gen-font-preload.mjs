// Wstrzykuje <link rel="preload" as="font"> do każdego out/**/*.html (brief #4a, 2026-11-06).
//
// Dlaczego: Next 16 NIE emituje preload dla fontów CSS-variable (`next/font/local` z `variable:`)
// w eksporcie statycznym — fonty są discovery'owane dopiero po sparsowaniu CSS (serializacja),
// co na zimnym 4G opóźnia FCP (discoveries 2026-11-06 „webfonty"). Naprawa: preload każdego
// self-hosted woff2 (łącznie ~94 KB po mikro-subsetach PL, budżet ≤120 KB spec §2b) prosto w <head>.
//
// Konwencja jak scripts/gen-headers.mjs: uruchamiany w `postbuild` po `next build`, pomija gdy
// out/ nie istnieje (to nie błąd przy samodzielnym uruchomieniu). IDMPOTENTNY: pomija strony,
// które już zawierają dany link. CSS preload fonta self-hosted nie wymaga zmian CSP (`font-src 'self'`).
//
// Nazwy plików w out/_next/static/media/ to hash'e Next (np. `6c596dfcddeca1e9-s.p.woff2`),
// bez prefiksów „inter-" — dlatego skanujemy KATALOG i preloadujemy każdy znaleziony woff2.
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";

const MEDIA_REL = join("_next", "static", "media");

// Rekurencyjnie zwraca nazwy (ścieżki relatywne do out/_next/static/media) plików .woff2.
export function collectFontFiles(outDir) {
  const mediaDir = join(outDir, MEDIA_REL);
  if (!existsSync(mediaDir)) return [];
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.toLowerCase().endsWith(".woff2")) found.push(relative(mediaDir, full).split(sep).join("/"));
    }
  };
  walk(mediaDir);
  return found;
}

// Rekurencyjnie zwraca ścieżki wszystkich plików .html pod outDir.
// POMIJA out/demo/** — wierne makiety z public/demo/ (AGENTS.md: nie „poprawiamy" ich;
// mają własny zawężony CSP z Google Fonts i własny lifecycle).
function collectHtmlFiles(dir, root, isDemo = false) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const demo = isDemo || (dir === root && entry === "demo");
    if (statSync(full).isDirectory()) found.push(...collectHtmlFiles(full, root, demo));
    else if (entry.toLowerCase().endsWith(".html") && !demo) found.push(full);
  }
  return found;
}

function fontPreloadTag(name) {
  const href = `/${MEDIA_REL.split(sep).join("/")}/${name}`;
  return `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`;
}

// Wstrzykuje tags do jednego HTML-a. Punkt wpięcia: bezpośrednio po OSTATNIM istniejącym
// <link rel="preload"> w <head> (pliki CSS Preload Nexta), a gdy go brak — zaraz po <head>.
// Zwraca true gdy plik zmieniono.
function injectIntoHtml(htmlPath, tags) {
  let html = readFileSync(htmlPath, "utf8");
  const missing = tags.filter((tag) => !html.includes(tag));
  if (missing.length === 0) return false;

  const headStart = html.indexOf("<head");
  if (headStart === -1) {
    console.warn(`[gen-font-preload] brak <head> w ${htmlPath} — pomijam`);
    return false;
  }
  const headEnd = html.indexOf("</head>", headStart);
  const head = html.slice(headStart, headEnd === -1 ? html.length : headEnd);

  // ostatni tag <link ... rel="preload" ...> w head (kolejność atrybutów wg Next: rel najpierw)
  let insertAt = -1;
  const linkRe = /<link\b[^>]*rel="preload"[^>]*>/g;
  let m;
  while ((m = linkRe.exec(head)) !== null) insertAt = m.index + m[0].length;

  if (insertAt !== -1) {
    // pozycja względem całego pliku: wewnątrz head, za ostatnim preloadem
    const absolute = headStart + insertAt;
    html = html.slice(0, absolute) + missing.join("") + html.slice(absolute);
  } else {
    // brak preloadów CSS — wstaw tuż po otwierającym tagu <head>
    const openEnd = html.indexOf(">", headStart) + 1;
    html = html.slice(0, openEnd) + missing.join("") + html.slice(openEnd);
  }

  writeFileSync(htmlPath, html, "utf8");
  return true;
}

// Przetwarza cały katalog out(); zwraca statystyki (używane też przez testy).
export function processOutDir(outDir) {
  const fonts = collectFontFiles(outDir);
  if (fonts.length === 0) {
    console.log("[gen-font-preload] brak plików woff2 w out/_next/static/media — pomijam.");
    return { htmlCount: 0, fontCount: 0, changed: 0 };
  }
  const tags = fonts.map(fontPreloadTag);
  const htmlFiles = collectHtmlFiles(outDir, outDir);
  let changed = 0;
  for (const file of htmlFiles) {
    if (injectIntoHtml(file, tags)) changed++;
  }
  return { htmlCount: htmlFiles.length, fontCount: fonts.length, changed };
}

// Entry point CLI (testy importują funkcje bez uruchamiania main).
import { pathToFileURL } from "node:url";
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  const outDir = resolve(process.cwd(), "out");
  if (!existsSync(outDir)) {
    console.log(
      "[gen-font-preload] out/ nie istnieje — pomijam. `postbuild` ma sens tylko po pełnym " +
        "`next build` (static export); to nie jest błąd przy samodzielnym uruchomieniu."
    );
    process.exit(0);
  }
  const stats = processOutDir(outDir);
  console.log(
    `[gen-font-preload] wstrzyknięto preload ${stats.fontCount} font(ów) w ${stats.htmlCount} stronach HTML ` +
      `(${stats.changed} zmienionych plików — reszta już zawierała linki).`
  );
}
