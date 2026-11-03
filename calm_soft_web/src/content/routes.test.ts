import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cases } from "./cases";
import { demos } from "./demos";
import { ksef } from "./ksef";
import { pricing } from "./pricing";
import { serviceSales, serviceSalesUi } from "./serviceSales";
import { services } from "./services";
import { site } from "./site";
import { solutions } from "./solutions";
import { steps } from "./steps";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function collectHrefValues(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectHrefValues(item, out);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if ((key === "href" || key.endsWith("Href")) && typeof child === "string") {
        out.push(child);
      }
      collectHrefValues(child, out);
    }
  }
}

function stripQueryAndHash(value: string): string {
  const cuts = [value.indexOf("?"), value.indexOf("#")].filter((i) => i !== -1);
  if (cuts.length === 0) return value;
  return value.slice(0, Math.min(...cuts));
}

function resolveHref(href: string): { external: boolean; problems: string[] } {
  if (/^https?:\/\//.test(href)) return { external: true, problems: [] };

  const path = stripQueryAndHash(href);
  const problems: string[] = [];
  const fail = (why: string) => {
    problems.push(`${why} — pełna wartość hrefa: ${href}`);
  };
  const staticRoute = (rel: string) => {
    if (!existsSync(join(ROOT, rel))) fail(`brak pliku trasy ${rel}`);
  };

  if (path === "/") {
    staticRoute("src/app/page.tsx");
  } else if (path === "/pricing/") {
    staticRoute("src/app/pricing/page.tsx");
  } else if (path === "/o-mnie/") {
    staticRoute("src/app/o-mnie/page.tsx");
  } else if (path === "/work/") {
    staticRoute("src/app/work/page.tsx");
  } else {
    const serviceMatch = /^\/uslugi\/([^/]+)\/$/.exec(path);
    const ksefMatch = /^\/ksef\/([^/]+)\/$/.exec(path);
    const demoMatch = /^\/demo\/([^/]+)\/index\.html$/.exec(path);

    if (serviceMatch) {
      const slug = serviceMatch[1];
      if (!existsSync(join(ROOT, "src", "app", "uslugi", "[slug]", "page.tsx"))) {
        fail("brak trasy src/app/uslugi/[slug]/page.tsx");
      }
      if (!services.some((s) => s.slug === slug)) {
        fail(`slug usługi "${slug}" nie występuje w services.ts`);
      }
    } else if (ksefMatch) {
      const erp = ksefMatch[1];
      if (!existsSync(join(ROOT, "src", "app", "ksef", "[erp]", "page.tsx"))) {
        fail("brak trasy src/app/ksef/[erp]/page.tsx");
      }
      if (!ksef.erps.some((e) => e.slug === erp)) {
        fail(`slug ERP "${erp}" nie występuje w ksef.erps (ksef.ts)`);
      }
    } else if (demoMatch) {
      const slug = demoMatch[1];
      if (!existsSync(join(ROOT, "public", "demo", slug, "index.html"))) {
        fail(`brak pliku public/demo/${slug}/index.html`);
      }
    } else {
      fail("nieznany kształt internal hrefa — tabela rezolucji go nie obejmuje");
    }
  }
  return { external: false, problems };
}

const contentData: Record<string, unknown> = {
  site,
  services,
  cases,
  demos,
  solutions,
  serviceSales,
  serviceSalesUi,
  ksef,
  steps,
  pricing,
};

function collectAllHrefs(): string[] {
  const hrefs: string[] = [];
  for (const value of Object.values(contentData)) collectHrefValues(value, hrefs);
  return hrefs;
}

describe("sieć bezpieczeństwa: pliki tras Next.js (harness 2026-11-02)", () => {
  it("statyczne trasy istnieją: /, /o-mnie/, /pricing/, /work/", () => {
    const routes = [
      "src/app/page.tsx",
      "src/app/o-mnie/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/work/page.tsx",
    ];
    const missing = routes.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missing, `brakujące pliki tras: ${missing.join(", ")}`).toEqual([]);
  });

  it("dynamiczna trasa /uslugi/[slug]/ istnieje i enumuruje services przez generateStaticParams", () => {
    const rel = "src/app/uslugi/[slug]/page.tsx";
    expect(existsSync(join(ROOT, rel)), `brak pliku trasy: ${rel}`).toBe(true);
    const content = readFileSync(join(ROOT, rel), "utf8");
    expect(content).toContain("generateStaticParams");
    expect(content).toContain("services.map(");
  });

  it("dynamiczna trasa /ksef/[erp]/ istnieje i enumuruje ksef.erps przez generateStaticParams", () => {
    const rel = "src/app/ksef/[erp]/page.tsx";
    expect(existsSync(join(ROOT, rel)), `brak pliku trasy: ${rel}`).toBe(true);
    const content = readFileSync(join(ROOT, rel), "utf8");
    expect(content).toContain("generateStaticParams");
    expect(content).toContain("ksef.erps.map(");
  });
});

describe("sieć bezpieczeństwa: internal hrefy z src/content (harness 2026-11-02)", () => {
  it("kolektor znajduje co najmniej jeden internal href w danych contentu", () => {
    const internal = collectAllHrefs().filter((href) => !/^https?:\/\//.test(href));
    expect(internal.length).toBeGreaterThan(0);
  });

  it("każdy internal href z contentu rozwiązuje się na istniejącą trasę lub zasób", () => {
    const problems: string[] = [];
    let internal = 0;
    for (const href of collectAllHrefs()) {
      const result = resolveHref(href);
      if (result.external) continue;
      internal += 1;
      problems.push(...result.problems);
    }
    expect(problems).toEqual([]);
    expect(internal).toBeGreaterThan(0);
  });
});
