import { describe, expect, it } from "vitest";
import { ksef, getKsefErpBySlug } from "./ksef";
import { site } from "./site";
import type { KsefPlan } from "./types";

const PLAN_ORDER: KsefPlan["id"][] = ["firma", "biuro", "pro"];

const FORBIDDEN = ["od 499", "gotow", "z półki", "dowolny development", "nasz", " my "];

// Recursively collects every string leaf of a value, used both for the ** balance check and the
// forbidden-phrase scan.
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

describe("ksef content", () => {
  it("ma unikalne slugi ERP w formacie kebab-case", () => {
    const slugs = ksef.erps.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("getKsefErpBySlug zwraca wpis dla znanego slug i undefined dla nieznanego", () => {
    expect(getKsefErpBySlug("comarch-erp-optima")?.name).toBe("Comarch ERP Optima");
    expect(getKsefErpBySlug("nieistniejacy-slug")).toBeUndefined();
  });

  it("contactHref jest zbudowany ze slug", () => {
    for (const erp of ksef.erps) expect(erp.contactHref).toBe(`/ksef/${erp.slug}/#contact`);
  });

  it("każda strona ERP ma dokładnie trzy plany w kolejności firma → biuro → pro, dokładnie jeden featured", () => {
    for (const erp of ksef.erps) {
      const { plans } = erp.pricing;
      expect(plans.map((p) => p.id)).toEqual(PLAN_ORDER);
      expect(plans.filter((p) => p.featured).length).toBe(1);
    }
  });

  it("każdy wiersz tabeli ma komórki dla każdego planu", () => {
    for (const erp of ksef.erps) {
      for (const row of erp.pricing.table) {
        for (const id of PLAN_ORDER) expect(row.cells).toHaveProperty(id);
      }
    }
  });

  it("żadna pozycja includes nie powtarza się w highlights planów ani w etykietach wierszy tabeli", () => {
    for (const erp of ksef.erps) {
      const includesSet = new Set(erp.pricing.includes.map((i) => i.trim().toLowerCase()));
      for (const plan of erp.pricing.plans) {
        for (const h of plan.highlights) expect(includesSet.has(h.trim().toLowerCase())).toBe(false);
      }
      for (const row of erp.pricing.table) expect(includesSet.has(row.label.trim().toLowerCase())).toBe(false);
    }
  });

  it("metaDescription ma maksymalnie 160 znaków, metaTitle i hero.h1 są niepuste", () => {
    for (const erp of ksef.erps) {
      expect(erp.metaDescription.length).toBeLessThanOrEqual(160);
      expect(erp.metaTitle.length).toBeGreaterThan(0);
      expect(erp.hero.h1.length).toBeGreaterThan(0);
    }
  });

  it("każdy string w ksef ma parzystą liczbę **, a pola bez emfazy jej nie zawierają", () => {
    for (const s of collectStrings(ksef)) {
      const count = (s.match(/\*\*/g) ?? []).length;
      expect(count % 2).toBe(0);
    }
    for (const erp of ksef.erps) {
      const noEmphasisFields = [
        erp.hero.h1,
        erp.metaTitle,
        erp.metaDescription,
        ...erp.pricing.plans.flatMap((p) => [p.price, p.cta, p.prefill]),
        ...erp.pricing.table.flatMap((row) => [
          row.label,
          ...Object.values(row.cells).filter((c): c is string => typeof c === "string"),
        ]),
      ];
      for (const field of noEmphasisFields) expect(field).not.toContain("**");
    }
  });

  it("nie zawiera zakazanych fraz", () => {
    const blob = JSON.stringify(ksef).toLowerCase();
    for (const phrase of FORBIDDEN) expect(blob).not.toContain(phrase.toLowerCase());
  });

  it("teaser.erpCta jest niepuste", () => {
    expect(ksef.teaser.erpCta.length).toBeGreaterThan(0);
  });

  it("site.footerLinks zawiera wpis KSeF", () => {
    expect(site.footerLinks).toContainEqual({ label: "KSeF", href: "/#ksef" });
  });

  it("legacy.notice.body wspomina o modelu subskrypcyjnym", () => {
    for (const erp of ksef.erps) {
      expect(erp.legacy.notice.body.join(" ")).toContain("subskrypcyj");
    }
  });

  it("faq ma co najmniej pięć pozycji i każde pytanie kończy się znakiem zapytania", () => {
    for (const erp of ksef.erps) {
      expect(erp.faq.items.length).toBeGreaterThanOrEqual(5);
      for (const item of erp.faq.items) expect(item.question.endsWith("?")).toBe(true);
    }
  });

  it("coverage ma dokładnie cztery kafle", () => {
    for (const erp of ksef.erps) {
      expect(erp.coverage.tiles.length).toBe(4);
    }
  });

  it("reliability.items są niepuste", () => {
    for (const erp of ksef.erps) {
      expect(erp.reliability.items.length).toBeGreaterThan(0);
    }
  });

  it("faq ma co najmniej siedem pozycji", () => {
    for (const erp of ksef.erps) {
      expect(erp.faq.items.length).toBeGreaterThanOrEqual(7);
    }
  });

  it("dokładnie jeden plan ma badge i ten plan jest featured", () => {
    for (const erp of ksef.erps) {
      const badged = erp.pricing.plans.filter((p) => p.badge);
      expect(badged.length).toBe(1);
      expect(badged[0]?.featured).toBe(true);
    }
  });

  it("wybrane pola bez emfazy nie zawierają **", () => {
    for (const erp of ksef.erps) {
      const noEmphasisFields = [
        erp.problem.punchline,
        erp.problem.badge,
        erp.legacy.claim,
        erp.legacy.title,
        erp.howItWorks.punchline,
        erp.pricing.includesNote,
        erp.support.claim,
        erp.legacy.notice.label,
        erp.reliability.claim,
        erp.savings.claim,
        erp.finalCta.claim,
        ...erp.coverage.tiles.flatMap((t) => [t.title, ...(t.highlight ? [t.highlight] : [])]),
        ...erp.pricing.plans.flatMap((p) => (p.badge ? [p.badge] : [])),
        ...erp.faq.items.flatMap((item) => [item.question, item.answer]),
      ];
      for (const field of noEmphasisFields) expect(field).not.toContain("**");
    }
  });
});
