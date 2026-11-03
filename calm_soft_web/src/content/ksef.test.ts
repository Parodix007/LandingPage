import { describe, expect, it } from "vitest";
import { ksef, getKsefErpBySlug } from "./ksef";
import { site } from "./site";
import type { KsefPlan } from "./types";

const PLAN_ORDER: KsefPlan["id"][] = ["standard", "pro"];
const FORBIDDEN = ["gotow", "z półki", "tylko taniej", "nasz"];

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

describe("ksef content", () => {
  it("ma unikalne slugi ERP i zachowuje lookup", () => {
    const slugs = ksef.erps.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(getKsefErpBySlug("comarch-erp-optima")).toBeUndefined();
    expect(getKsefErpBySlug("nieistniejacy-slug")).toBeUndefined();
  });

  it("ma zatwierdzone menu, zajawkę i metadata", () => {
    expect(ksef.nav.triggerLabel).toBe("KSeF w ERP");
    expect(ksef.teaser.heading).toBe("KSeF w Twoim ERP. Dopasowany do sposobu pracy firmy.");
  });

  it("ma dokładnie dwa plany w kolejności Standard → PRO, z PRO wyróżnionym", () => {
    for (const erp of ksef.erps) {
      expect(erp.pricing.plans.map((p) => p.id)).toEqual(PLAN_ORDER);
      expect(erp.pricing.plans.filter((p) => p.featured).map((p) => p.id)).toEqual(["pro"]);
      expect(erp.pricing.plans[0]?.price).toMatch(/^\d+ zł$/);
      expect(erp.pricing.plans[1]?.price).toBe("od 699 zł");
      expect(erp.pricing.plans[1]?.highlights).toContain("od 2 godzin miesięcznie zarezerwowanych na rozwój rozwiązania");
    }
  });

  it("każdy wiersz tabeli ma komórki obu planów i brak dublowania wspólnego zakresu", () => {
    for (const erp of ksef.erps) {
      expect(erp.pricing.table.map((row) => row.label)).toEqual(expect.arrayContaining([
        "Rozwój rozwiązania",
        "Planowanie prac",
        "Zwiększenie zakresu",
        "Opieka nad zmianami",
        "Wsparcie techniczne",
        "Aktualizacje i utrzymanie",
        "Monitoring działania",
      ]));
      for (const label of ["Wsparcie techniczne", "Aktualizacje i utrzymanie", "Monitoring działania"]) {
        const row = erp.pricing.table.find((item) => item.label === label);
        expect(row?.cells).toEqual({ standard: true, pro: true });
      }
      for (const row of erp.pricing.table) {
        for (const id of PLAN_ORDER) expect(row.cells).toHaveProperty(id);
      }
      const includes = new Set(erp.pricing.includes.map((i) => i.toLowerCase()));
      for (const row of erp.pricing.table) expect(includes.has(row.label.toLowerCase())).toBe(false);
      for (const plan of erp.pricing.plans) for (const item of plan.highlights) expect(includes.has(item.toLowerCase())).toBe(false);
    }
  });

  it("nie zawiera zakazanych fraz ani głosu mnogiego", () => {
    const blob = collectStrings(ksef).join(" ").toLowerCase();
    for (const phrase of FORBIDDEN) expect(blob).not.toContain(phrase.toLowerCase());
    expect(blob).not.toContain("pro nie jest wymagany, aby zamawiać indywidualne zmiany.");
    expect(blob).not.toMatch(/\bmy\b/);
  });

  it("zachowuje format RichText i pełny kontakt", () => {
    for (const s of collectStrings(ksef)) expect((s.match(/\*\*/g) ?? []).length % 2).toBe(0);
    for (const erp of ksef.erps) {
      expect(erp.contactHref).toBe(`/ksef/${erp.slug}/#contact`);
      expect(erp.contact.form.title.length).toBeGreaterThan(0);
    }
    expect(site.footerLinks).toContainEqual({ label: "KSeF", href: "/#ksef" });
  });
});
