import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { writeZip, readZipEntryNames, buildPackage, checkPackage } from "./release-package.mjs";

// Helper: zapisuje plik o ścieżce relatywnej (separator `/`), tworząc katalogi.
function putFile(root, rel, content) {
  const full = join(root, ...rel.split("/"));
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function makeFixture(root) {
  putFile(root, "package.json", "{}");
  putFile(root, "package-lock.json", "{}");
  putFile(root, "next.config.ts", "export default {}");
  putFile(root, "src/app/page.tsx", "export default function Page() { return null; }");
  putFile(root, "public/demo/x/index.html", "<html></html>");
  putFile(root, "src/content/site.ts", "export const site = {};");
  putFile(root, "node_modules/junk.js", "// junk");
  putFile(root, ".next/cache.tmp", "cache");
  putFile(root, "out/index.html", "<html></html>");
  putFile(root, ".env", "SECRET=1");
  putFile(root, ".env.local", "SECRET=2");
}

test("release-package: buildPackage + checkPackage", async (t) => {
  const tmp = mkdtempSync(join(os.tmpdir(), "relpkg-"));
  t.after(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  makeFixture(tmp);
  const goodZip = join(tmp, "release.zip");
  const badZip = join(tmp, "bad.zip");

  // (a) buildPackage zwraca nazwy z separatorami `/` (bez `\`, bez `./`).
  const names = buildPackage(tmp, goodZip);
  assert.ok(names.includes("src/app/page.tsx"), "ma zawierać src/app/page.tsx");
  assert.ok(names.includes("public/demo/x/index.html"), "ma zawierać public/demo/x/index.html");
  assert.ok(names.includes("src/content/site.ts"), "ma zawierać src/content/site.ts");
  for (const n of names) {
    assert.ok(!n.includes("\\"), `nazwa bez backslasha: ${n}`);
    assert.ok(!n.startsWith("./"), `nazwa bez ./ na początku: ${n}`);
  }

  // Round-trip: reader zwraca dokładnie te same nazwy co writer.
  assert.deepEqual(readZipEntryNames(goodZip).sort(), [...names].sort());

  // (b) brak jakichkolwiek .env*, node_modules/, .next/, out/, .git/.
  for (const n of names) {
    const base = n.split("/").pop();
    assert.ok(!base.startsWith(".env"), `brak .env*, znaleziono: ${n}`);
    assert.ok(!n.startsWith("node_modules/"), `brak node_modules/, znaleziono: ${n}`);
    assert.ok(!n.startsWith(".next/"), `brak .next/, znaleziono: ${n}`);
    assert.ok(!n.startsWith("out/"), `brak out/, znaleziono: ${n}`);
    assert.ok(!n.startsWith(".git/"), `brak .git/, znaleziono: ${n}`);
  }
  assert.ok(!names.includes("node_modules/junk.js"), "pomijany node_modules/junk.js");
  assert.ok(!names.includes(".next/cache.tmp"), "pomijany .next/cache.tmp");
  assert.ok(!names.includes("out/index.html"), "pomijany out/index.html");

  // (c) checkPackage na wyprodukowanej paczce -> ok: true.
  const good = checkPackage(goodZip);
  assert.equal(
    good.ok,
    true,
    `oczekiwano ok, problemy: ${JSON.stringify(good.problems)}`
  );
  assert.deepEqual(good.problems, []);

  // (d) zła paczka: separator \, .env*, katalog zakazany (wymagane pliki są,
  //     więc testujemy gałąź separatorów/ekskluzji, a nie braku required).
  writeZip(badZip, [
    { name: "package.json", data: Buffer.from("{}") },
    { name: "package-lock.json", data: Buffer.from("{}") },
    { name: "next.config.ts", data: Buffer.from("export default {}") },
    { name: "src/app/page.tsx", data: Buffer.from("x") },
    { name: ".env", data: Buffer.from("SECRET=1") },
    { name: "a\\b.txt", data: Buffer.from("x") },
    { name: "node_modules/x.js", data: Buffer.from("x") },
  ]);
  const bad = checkPackage(badZip);
  assert.equal(bad.ok, false, "zła paczka nie może być ok");
  assert.ok(bad.problems.length > 0, "zła paczka ma niepuste problemy");
  // Konkretnie: separator, .env i zakazany katalog.
  assert.ok(bad.problems.some((p) => p.includes("a\\b.txt")), "wykryty backslash");
  assert.ok(bad.problems.some((p) => p.includes(".env")), "wykryty .env");
  assert.ok(
    bad.problems.some((p) => p.includes("node_modules")),
    "wykryty zakazany katalog node_modules"
  );
});
