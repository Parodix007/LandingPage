import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { collectFontFiles, processOutDir } from "./gen-font-preload.mjs";

// Helper: zapisuje plik o ścieżce relatywnej (separator `/`), tworząc katalogi.
function putFile(root, rel, content) {
  const full = join(root, ...rel.split("/"));
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

//_fixture_ = katalog `out/` z podrobionym HTML + media (konwencja release-package.test.mjs).
function makeFixture(root) {
  // Media — emulowane nazwy emitowane przez Next (hash + opcjonalne sufiksy -s.p/.p;
  // zweryfikowane na prawdziwym out/: `6c596dfcddeca1e9-s.p.woff2` itp.)
  putFile(root, "out/_next/static/media/inter-latin.woff2", "wOF2-fake-a");
  putFile(root, "out/_next/static/media/interExt-1.woff2", "wOF2-fake-b");
  putFile(root, "out/_next/static/media/jbm-latin.p.woff2", "wOF2-fake-c");
  // (a) strona z istniejącym preloadem CSS — wstrzyknięcie ma iść bezpośrednio po nim
  putFile(
    root,
    "out/index.html",
    `<html lang="pl"><head><meta charset="utf-8"><title>Start</title>` +
      `<link rel="preload" href="/_next/static/css/a.css" as="style" />` +
      `<link rel="stylesheet" href="/_next/static/css/a.css" /></head>` +
      `<body><main id="body-marker-xyz">treść</main></body></html>`
  );
  // (d) strona bez jakiegokolwiek preloadu — wstrzyknięcie po <head>; reszta HTML nietknięta
  putFile(
    root,
    "out/o-mnie/index.html",
    `<html lang="pl"><head><meta charset="utf-8"><title>O mnie</title>` +
      `<link rel="stylesheet" href="/_next/static/css/b.css" /></head>` +
      `<body><main id="body-marker-abc">więcej treści</main></body></html>`
  );
  // Plik nie-HTML — nie może zostać dotknięty
  putFile(root, "out/notatki.txt", "nie ruszaj");
  // Wierne makiety z public/demo/ — NIE wolno ich dotykać (AGENTS.md)
  putFile(
    root,
    "out/demo/makieta/index.html",
    `<html lang="pl"><head><title>Makieta</title></head><body id="demo-body-keepme">makieta</body></html>`
  );
}

const FONT_TAGS = (names) =>
  names.map((n) => {
    const href = `/_next/static/media/${n}`;
    return `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`;
  });

test("gen-font-preload: collectFontFiles zwraca wszystkie woff2 z media (recursively)", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  const names = collectFontFiles(join(tmp, "out")).sort();
  assert.deepEqual(names, [
    "inter-latin.woff2",
    "interExt-1.woff2",
    "jbm-latin.p.woff2",
  ]);
});

test("gen-font-preload: wstrzykuje linki dla WSZYSTKICH woff2 we WSZYSTKICH html", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  const stats = processOutDir(join(tmp, "out"));
  assert.equal(stats.htmlCount, 2, "2 strony HTML w fikszerze");
  assert.equal(stats.fontCount, 3, "3 pliki woff2 w fikszerze");

  for (const page of ["out/index.html", "out/o-mnie/index.html"]) {
    const html = readFileSync(join(tmp, ...page.split("/")), "utf8");
    for (const tag of FONT_TAGS(["inter-latin.woff2", "interExt-1.woff2", "jbm-latin.p.woff2"])) {
      assert.ok(html.includes(tag), `${page}: brak linku ${tag}`);
    }
  }
});

test("gen-font-preload: atrybuty as=font type=font/woff2 crossorigin + kolejność po preload CSS", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  processOutDir(join(tmp, "out"));
  const html = readFileSync(join(tmp, "out", "index.html"), "utf8");

  // każdy link fontowy ma komplet atrybutów
  for (const m of html.matchAll(/<link rel="preload" href="\/_next\/static\/media\/[^"]+"[^>]*>/g)) {
    assert.match(m[0], / as="font"/);
    assert.match(m[0], / type="font\/woff2"/);
    assert.match(m[0], / crossorigin( |>)/);
  }
  // wstrzyknięcie bezpośrednio po istniejącym preloadzie CSS, PRZED <link rel=stylesheet>
  const cssPreloadPos = html.indexOf(`<link rel="preload" href="/_next/static/css/a.css" as="style" />`);
  const firstFontPos = html.indexOf(`/_next/static/media/`);
  const stylesheetPos = html.indexOf(`<link rel="stylesheet"`);
  assert.ok(cssPreloadPos !== -1 && firstFontPos > cssPreloadPos, "preload fontu po preloaded CSS");
  assert.ok(firstFontPos < stylesheetPos, "preload fontu przed <link rel=stylesheet> w index.html");
});

test("gen-font-preload: idempotentność — drugie uruchomienie nie duplikuje", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  processOutDir(join(tmp, "out"));
  const first = readFileSync(join(tmp, "out", "index.html"), "utf8");
  processOutDir(join(tmp, "out"));
  const second = readFileSync(join(tmp, "out", "index.html"), "utf8");
  assert.equal(second, first, "plik HTML musi pozostać identyczny po drugim uruchomieniu");
  const links = second.match(/rel="preload" href="\/_next\/static\/media\//g) ?? [];
  assert.equal(links.length, 3, "dokładnie 3 linki fontowe (bez duplikatów)");
});

test("gen-font-preload: pomija out/demo/** (wierne makiety public/demo/ nietknięte)", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  const demoPath = join(tmp, "out", "demo", "makieta", "index.html");
  const before = readFileSync(demoPath, "utf8");
  const stats = processOutDir(join(tmp, "out"));
  assert.equal(stats.htmlCount, 2, "demo nie wlicza się do stron przetwarzanych");
  assert.equal(readFileSync(demoPath, "utf8"), before, "HTML makiet nie może być zmieniony");
});

test("gen-font-preload: nie dotyka reszty HTML ani plików nie-HTML", (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "fontpreload-"));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  makeFixture(tmp);
  const before = readFileSync(join(tmp, "out", "o-mnie", "index.html"), "utf8");
  processOutDir(join(tmp, "out"));
  const after = readFileSync(join(tmp, "out", "o-mnie", "index.html"), "utf8");
  // usunięcie samych wstrzykniętych linków musi zwrócić oryginalny HTML (zero innych zmian)
  const stripped = after.replace(/ ?<link rel="preload" href="\/_next\/static\/media\/[^"]+" as="font" type="font\/woff2" crossorigin \/>/g, "");
  assert.equal(stripped, before, "poza wstrzykniętymi linkami HTML nie może się różnić");
  assert.ok(after.includes(`<main id="body-marker-abc">więcej treści</main>`), "body nietknięty");
  assert.equal(readFileSync(join(tmp, "out", "notatki.txt"), "utf8"), "nie ruszaj", "plik nie-HTML nietknięty");
});
