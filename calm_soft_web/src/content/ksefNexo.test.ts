import { describe, expect, it } from "vitest";
import { getKsefErpBySlug } from "./ksef";

const nexo = () => getKsefErpBySlug("rachmistrz-nexo");

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}

describe("KSeF w Rachmistrzu Nexo", () => {
  it("udostępnia stabilny slug, nazwę, canonical contact i metadata", () => {
    const page = nexo();

    expect(page).toBeDefined();
    expect(page?.name).toBe("Rachmistrz Nexo / Nexo PRO");
    expect(page?.contactHref).toBe("/ksef/rachmistrz-nexo/#contact");
    expect(page?.metaTitle).toBe("KSeF w Rachmistrzu Nexo i Nexo PRO | calm_soft");
    expect(page?.metaDescription).toContain("Odbiór faktur z KSeF");
  });

  it("opisuje wyłącznie odbiór faktur dla obu wersji Rachmistrza", () => {
    const page = nexo();
    const blob = collectStrings(page).join(" ").toLowerCase();

    expect(page?.hero.lead).toContain("Odbieraj");
    expect(blob).toContain("rachmistrz");
    expect(blob).toContain("nexo pro");
    expect(blob).not.toContain("comarch");
    expect(blob).not.toContain("optima");
    expect(blob).not.toContain("wysył");
    expect(blob).not.toMatch(/\bupo\b/);
  });

  it("ma 350 zł w Standardzie i od 699 zł w abonamencie PRO", () => {
    const plans = nexo()?.pricing.plans;

    expect(plans?.map((plan) => plan.id)).toEqual(["standard", "pro"]);
    expect(plans?.[0]?.price).toBe("350 zł");
    expect(plans?.[1]?.price).toBe("od 699 zł");
    expect(plans?.filter((plan) => plan.featured).map((plan) => plan.id)).toEqual(["pro"]);
    expect(plans?.[0]?.prefill).toContain("Rachmistrza Nexo");
    expect(plans?.[1]?.prefill).toContain("Rachmistrza Nexo");
    expect(plans?.[1]?.highlights).toContain("od 2 godzin miesięcznie zarezerwowanych na rozwój rozwiązania");
    expect(plans?.[1]?.noteLabel).toBe("Warunki planu PRO");
    expect(plans?.[1]?.note).toContain("nie przechodzi na kolejne okresy");
  });

  it("zachowuje pełną skorupę strony i jawne ograniczenie zgodności starszych wersji", () => {
    const page = nexo();

    expect(page?.legacy.steps).toHaveLength(3);
    expect(page?.development.items).toHaveLength(6);
    expect(page?.coverage.tiles).toHaveLength(6);
    expect(page?.monitoring.items).toHaveLength(4);
    expect(page?.howItWorks.steps).toHaveLength(5);
    expect(page?.audience.items).toHaveLength(5);
    expect(page?.faq.items).toHaveLength(10);
    const legacyRow = page?.pricing.table.find((row) => row.label === "Obsługa starszych wersji Rachmistrza Nexo");
    expect(legacyRow?.cells).toEqual({ standard: "po sprawdzeniu zgodności", pro: "po sprawdzeniu zgodności" });
    expect(collectStrings(page?.legacy).join(" ").toLowerCase()).toContain("sprawdzam");
    expect(collectStrings(page?.legacy).join(" ").toLowerCase()).not.toContain("każdą wersję");
    expect(collectStrings(page).join(" ")).not.toMatch(/\bmy\b/);
  });
});
