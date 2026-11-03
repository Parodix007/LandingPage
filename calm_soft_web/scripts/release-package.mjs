// scripts/release-package.mjs
//
// Bezpieczny packer paczki deployowej calm_soft_web.
//
// Powód istnienia (incydent 2026-10-29): PowerShell `Compress-Archive` wyprodukował entry z
// separatorami `\` (błąd buildu na Hostingerze), a `.env` wyleciał do paczki (ekskluzje obejmowały
// tylko `.env.local`/`.env.development`). Ten skrypt gwarantuje oba inwarianty mechanicznie:
//   1. nazwy entry są scieżkami relatywnymi z separatorami `/` (bez `\`, bez `./` na początku);
//   2. do paczki nie trafia żaden plik `.env*` ani żadna zawartość `.git/`, `.next/`,
//      `node_modules/`, `out/`.
//
// Tylko stdlib Node >= 22, ESM. Żadnych nowych zależności.
//
// CLI:
//   node scripts/release-package.mjs <output.zip>     -> buduje paczkę z root repo (dirname(..)/..)
//   node scripts/release-package.mjs --check <zip>    -> waliduje istniejącą paczkę
//   (brak argumentów / nieznany tryb -> użycie + exit 2)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep as pathSep } from "node:path";
import { deflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// CRC32 (tablica) — potrzebny do nagłówków ZIP.
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// writeZip — minimalny, POPRAWNY writer ZIP (local headers + central dir + EOCD).
// entry.name jest zapisywany dokładnie tak, jak podany (UTF-8, flaga bit 11).
// ---------------------------------------------------------------------------
export function writeZip(outZipPath, entries) {
  const localParts = [];
  const centralParts = [];

  const now = new Date();
  const dosTime =
    ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xffff;
  const dosDate =
    (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  const flags = 0x0800; // bit 11: nazwa w UTF-8

  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const raw = entry.data;
    const crc = crc32(raw);

    // DEFLATE, chyba że STORED jest równie lub bardziej efektywne.
    const deflated = deflateRawSync(raw);
    const useDeflate = deflated.length < raw.length;
    const method = useDeflate ? 8 : 0;
    const stored = useDeflate ? deflated : raw;
    const compressedSize = stored.length;
    const uncompressedSize = raw.length;

    // Local file header (30 bajtów + nazwa).
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // wersja potrzebna
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // długość extra
    nameBuf.copy(local, 30);

    // Central directory file header (46 bajtów + nazwa).
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // wersja tworzona
    central.writeUInt16LE(20, 6); // wersja potrzebna
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // komentarz
    central.writeUInt16LE(0, 34); // dysk start
    central.writeUInt16LE(0, 36); // atrybuty wewnętrzne
    central.writeUInt32LE(0, 38); // atrybuty zewnętrzne
    central.writeUInt32LE(offset, 42); // offset lokalnego nagłówka
    nameBuf.copy(central, 46);

    localParts.push(local, stored);
    centralParts.push(central);
    offset += local.length + stored.length;
  }

  const centralStart = offset;
  const centralSize = centralParts.reduce((s, b) => s + b.length, 0);

  // End of central directory record (22 bajty, bez komentarza).
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // dysk
  eocd.writeUInt16LE(0, 6); // dysk ze startem centralnego katalogu
  eocd.writeUInt16LE(entries.length, 8); // entry na tym dysku
  eocd.writeUInt16LE(entries.length, 10); // wszystkich entry
  eocd.writeUInt32LE(centralSize, 12); // rozmiar centralnego katalogu
  eocd.writeUInt32LE(centralStart, 16); // offset centralnego katalogu
  eocd.writeUInt16LE(0, 20); // długość komentarza

  writeFileSync(outZipPath, Buffer.concat([...localParts, ...centralParts, eocd]));
}

// ---------------------------------------------------------------------------
// readZipEntryNames — parsuje EOCD + centralny katalog, zwraca nazwy entry.
// ---------------------------------------------------------------------------
export function readZipEntryNames(zipPath) {
  const buf = readFileSync(zipPath);
  if (buf.length < 22) {
    throw new Error("Plik nie jest poprawnym ZIP-em (za krótki).");
  }

  // Szukamy EOCD od końca pliku (ostatni pasujący to właściwy rekord).
  const minStart = Math.max(0, buf.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) {
    throw new Error("Plik nie jest poprawnym ZIP-em (brak EOCD).");
  }

  const total = buf.readUInt16LE(eocd + 10);
  const centralStart = buf.readUInt32LE(eocd + 16);

  const names = [];
  let pos = centralStart;
  for (let i = 0; i < total; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) {
      throw new Error("Uszkodzony centralny katalog ZIP (błędna sygnatura entry).");
    }
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    names.push(buf.toString("utf8", pos + 46, pos + 46 + nameLen));
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

// ---------------------------------------------------------------------------
// buildPackage — allowlist paczki deployowej. W root pakowane są wyłącznie
// pliki z ALLOWED_ROOT_FILES, a rekurencyjnie wyłącznie katalogi z
// ALLOWED_DIRS. W rekurencji nadal pomijamy katalogi ze SKIP_DIRS oraz pliki
// `.env*` (defense in depth). Nieobecność katalogu z ALLOWED_DIRS jest błędem:
// cicha pusta paczka jest gorsza od crasha. Nazwy entry: scieżki relatywne
// od root, separator `/`, bez `./`.
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set([".git", ".next", "node_modules", "out"]);
const ALLOWED_DIRS = ["src", "public", "scripts"];
const ALLOWED_ROOT_FILES = [".nvmrc", "next-env.d.ts", "next.config.ts", "package.json", "package-lock.json", "postcss.config.mjs", "tsconfig.json"];

export function buildPackage(root, outZipPath) {
  const rootItems = readdirSync(root, { withFileTypes: true });
  const rootDirs = new Set(
    rootItems.filter((item) => item.isDirectory()).map((item) => item.name)
  );
  const missingDirs = ALLOWED_DIRS.filter((dir) => !rootDirs.has(dir));
  if (missingDirs.length > 0) {
    throw new Error(`Brak katalogów z ALLOWED_DIRS w ${root}: ${missingDirs.join(", ")}`);
  }

  const entries = [];

  function walk(dir) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = join(dir, item.name);
      if (item.isDirectory()) {
        if (SKIP_DIRS.has(item.name)) continue;
        walk(full);
      } else if (item.isFile()) {
        if (item.name.startsWith(".env")) continue;
        const rel = relative(root, full).split(pathSep).join("/");
        entries.push({ name: rel, data: readFileSync(full) });
      }
    }
  }

  for (const item of rootItems) {
    const full = join(root, item.name);
    if (item.isDirectory()) {
      if (ALLOWED_DIRS.includes(item.name)) walk(full);
    } else if (item.isFile() && ALLOWED_ROOT_FILES.includes(item.name)) {
      entries.push({ name: item.name, data: readFileSync(full) });
    }
  }

  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  writeZip(outZipPath, entries);
  return entries.map((e) => e.name);
}

// ---------------------------------------------------------------------------
// checkPackage — walidacja paczki: separatory, ekskluzje, pliki wymagane oraz
// bramka FORBIDDEN_TOP odrzucająca entry spoza kontraktu allowlist — mechaniczna
// antyregresja po incydencie 2026-10-29, gdy do paczki trafiły docs/, README.md,
// opencode.json i `.env`; zestaw niżej jest prewencyjnie szerszy niż tamta delta.
// ---------------------------------------------------------------------------
const REQUIRED = ["package.json","package-lock.json","next.config.ts","tsconfig.json","postcss.config.mjs",".nvmrc","src/app/page.tsx","src/app/layout.tsx","scripts/assert-env.mjs","scripts/csp.mjs","scripts/gen-headers.mjs"];
const FORBIDDEN_DIRS = [".next", "node_modules", "out", ".git"];
const FORBIDDEN_TOP_DIRS = new Set(["docs", ".idea", ".claude", ".codex", ".agents", ".github", ".wrangler", ".vercel"]);
const FORBIDDEN_TOP_ROOT_FILES = new Set(["opencode.json", "lighthouse.json", "tsconfig.tsbuildinfo", "eslint.config.mjs", "vitest.config.ts", "AGENTS.md", "CLAUDE.md", "README.md", ".gitignore", "serve.json", "zipcheck"]);

function isUnder(name, dir) {
  return name === dir || name.startsWith(dir + "/");
}

export function checkPackage(zipPath) {
  const names = readZipEntryNames(zipPath);
  const problems = [];
  const nameSet = new Set(names);

  for (const name of names) {
    let flagged = false;
    if (name.includes("\\")) {
      problems.push(`separator \\ w nazwie entry: ${name}`);
      flagged = true;
    }
    const parts = name.split("/");
    const base = parts[parts.length - 1];
    if (base.startsWith(".env")) {
      problems.push(`plik .env* w paczce: ${name}`);
      flagged = true;
    }
    for (const dir of FORBIDDEN_DIRS) {
      if (isUnder(name, dir)) {
        problems.push(`entry w zakazanym katalogu ${dir}/: ${name}`);
        flagged = true;
        break;
      }
    }
    const offContract =
      FORBIDDEN_TOP_DIRS.has(parts[0]) ||
      (parts.length === 1 && FORBIDDEN_TOP_ROOT_FILES.has(name));
    if (!flagged && offContract) {
      problems.push(`plik lub katalog spoza kontraktu paczki: ${name}`);
    }
  }

  for (const req of REQUIRED) {
    if (!nameSet.has(req)) {
      problems.push(`brak wymaganego pliku: ${req}`);
    }
  }

  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------
// CLI — tylko gdy skrypt jest uruchamiany bezpośrednio.
// ---------------------------------------------------------------------------
const __entry = process.argv[1];
const __isDirectRun =
  !!__entry && resolve(__entry) === fileURLToPath(import.meta.url);

if (__isDirectRun) {
  const args = process.argv.slice(2);

  if (args[0] === "--check") {
    const zip = args[1];
    if (!zip) {
      console.error("Użycie: node scripts/release-package.mjs --check <zip>");
      process.exit(2);
    }
    const { ok, problems } = checkPackage(zip);
    if (ok) {
      console.log(`OK: ${zip} — paczka poprawna.`);
      process.exit(0);
    } else {
      console.error(`BŁĄDY w ${zip}:`);
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
  } else if (args.length === 1) {
    const out = args[0];
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const names = buildPackage(root, out);
    console.log(`Zapakowano ${names.length} plików do ${out}`);
    process.exit(0);
  } else {
    console.error(
      [
        "Użycie:",
        "  node scripts/release-package.mjs <output.zip>     — zbuduj paczkę deployową",
        "  node scripts/release-package.mjs --check <zip>    — zwaliduj istniejącą paczkę",
      ].join("\n")
    );
    process.exit(2);
  }
}
