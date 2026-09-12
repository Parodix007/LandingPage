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
    expect(getKsefErpBySlug("comarch-erp-optima")?.name).toBe("Comarch ERP Optima");
    expect(getKsefErpBySlug("nieistniejacy-slug")).toBeUndefined();
  });

  it("ma zatwierdzone menu, zajawkę i metadata", () => {
    expect(ksef.nav.triggerLabel).toBe("KSeF w ERP");
    expect(ksef.teaser.heading).toBe("KSeF w Twoim ERP. Dopasowany do sposobu pracy firmy.");
    const page = ksef.erps[0]!;
    expect(page.metaTitle).toBe("KSeF w Comarch ERP Optima bez limitu | calm_soft");
    expect(page.metaDescription).toBe("KSeF dla Comarch ERP Optima bez limitu dokumentów. Obsługa starszych wersji, wiele firm, monitoring, wsparcie i możliwość indywidualnego rozwoju rozwiązania.");
    expect(page.hero.bullets).toHaveLength(4);
  });

  it("ma dokładnie dwa plany w kolejności Standard → PRO, z PRO wyróżnionym", () => {
    for (const erp of ksef.erps) {
      expect(erp.pricing.plans.map((p) => p.id)).toEqual(PLAN_ORDER);
      expect(erp.pricing.plans.filter((p) => p.featured).map((p) => p.id)).toEqual(["pro"]);
      expect(erp.pricing.plans[0]?.price).toBe("249 zł");
      expect(erp.pricing.plans[1]?.price).toBe("od 699 zł");
      expect(erp.pricing.plans[1]?.highlights).toContain("od 2 godzin miesięcznie zarezerwowanych na rozwój rozwiązania");
    }
  });

  it("przechowuje warunki PRO wyłącznie w etykiecie i krótkim opisie tooltipa", () => {
    const pro = ksef.erps[0]!.pricing.plans.find((plan) => plan.id === "pro");
    expect(pro?.noteLabel).toBe("Warunki planu PRO");
    expect(pro?.note).toBe("Zarezerwowany zakres obowiązuje w danym okresie rozliczeniowym i nie przechodzi na kolejne okresy. Większe prace i dodatkowy zakres ustalam przed rozpoczęciem realizacji.");
    expect(JSON.stringify(ksef)).not.toContain("PRO nie jest wymagany, aby zamawiać indywidualne zmiany.");
  });

  it("każdy wiersz tabeli ma komórki obu planów i brak dublowania wspólnego zakresu", () => {
    for (const erp of ksef.erps) {
      expect(erp.pricing.table.map((row) => row.label)).toEqual([
        "Rozwój rozwiązania",
        "Planowanie prac",
        "Zwiększenie zakresu",
        "Opieka nad zmianami",
        "Wsparcie techniczne",
        "Obsługa starszych wersji Optimy",
        "Aktualizacje i utrzymanie",
        "Monitoring działania",
      ]);
      for (const label of ["Wsparcie techniczne", "Obsługa starszych wersji Optimy", "Aktualizacje i utrzymanie", "Monitoring działania"]) {
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

  it("zawiera wszystkie sekcje w zatwierdzonej kolejności i 10 FAQ", () => {
    const page = ksef.erps[0]!;
    expect(page.legacy.steps).toHaveLength(3);
    expect(page.development.items.length).toBeGreaterThan(0);
    expect(page.coverage.tiles).toHaveLength(6);
    expect(page.monitoring.items).toHaveLength(4);
    expect(page.comparison.standard.title).toBe("Standard");
    expect(page.comparison.pro.title).toBe("PRO");
    expect(page.otherErp.cta).toBe("Zapytaj o mój ERP");
    expect(page.howItWorks.steps).toHaveLength(5);
    expect(page.audience.items).toHaveLength(5);
    expect(page.faq.items).toHaveLength(10);
    expect(page.hero.pricingCta).toBe("Zobacz cennik");
  });

  it("CTA planów i innego ERP mają prefill, pozostałe CTA używają contactHref", () => {
    const page = ksef.erps[0]!;
    expect(page.hero.cta).toBe("Sprawdź zgodność mojej Optimy");
    expect(page.legacy.cta).toBe("Sprawdź moją wersję Optimy");
    expect(page.otherErp.prefill).toContain("ERP");
    expect(page.pricing.plans[0]?.prefill).toBe("Interesuje mnie plan Standard dla Comarch ERP Optima.");
    expect(page.pricing.plans[1]?.prefill).toBe("Interesuje mnie plan PRO dla Comarch ERP Optima i regularny rozwój rozwiązania.");
    expect(page.otherErp.prefill).toBe("Chcę zapytać o możliwość integracji KSeF z moim ERP.");
    expect(page.finalCta.cta).toBe("Sprawdź moją Optimę");
  });

  it("nie zawiera zakazanych fraz ani głosu mnogiego", () => {
    const blob = collectStrings(ksef).join(" ").toLowerCase();
    for (const phrase of FORBIDDEN) expect(blob).not.toContain(phrase.toLowerCase());
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
