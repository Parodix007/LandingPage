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

    expect(page?.hero.h1).toContain("Odbieraj");
    expect(page?.hero.h1).toContain("**Cenę InsPunktów odliczę od abonamentu.**");
    expect(page?.hero.lead).toContain("pełną cenę netto");
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
    expect(page?.faq.items).toHaveLength(12);
    const legacyRow = page?.pricing.table.find((row) => row.label === "Obsługa starszych wersji Rachmistrza Nexo");
    expect(legacyRow?.cells).toEqual({ standard: "po sprawdzeniu zgodności", pro: "po sprawdzeniu zgodności" });
    expect(collectStrings(page?.legacy).join(" ").toLowerCase()).toContain("sprawdzam");
    expect(collectStrings(page?.legacy).join(" ").toLowerCase()).not.toContain("każdą wersję");
    expect(collectStrings(page).join(" ")).not.toMatch(/\bmy\b/);
  });

  it("udostępnia ofertę i warunki odliczenia ostatniego pakietu InsPunktów", () => {
    const page = nexo();
    const offer = page?.switchOffer;
    const faq = page?.faq.items;

    expect(offer).toBeDefined();
    expect(offer?.entryHref).toBe("/ksef/rachmistrz-nexo/?rabat=inspunkty#contact");
    expect(offer?.prefill).toBe("Chcę skorzystać z rabatu za ostatni pakiet InsPunktów i omówić odbiór faktur z KSeF w Rachmistrzu nexo.");
    expect(offer?.conditionsHref).toBe("/ksef/rachmistrz-nexo/#nexo-rabat-faq");
    expect(offer?.stickyLabel).toBe("Rabat za InsPunkty");
    expect(faq?.slice(0, 2).map((item) => item.id)).toEqual(["nexo-rabat-faq", "nexo-rabat-przyklad"]);
    expect(faq?.[0]?.answer).toContain("minimum 6 miesięcy");
    expect(faq?.[0]?.answer).toContain("pełną cenę netto jednego, ostatniego pakietu");
    expect(faq?.[0]?.answer).toContain("Wykorzystanie części lub wszystkich punktów nie pomniejsza rabatu");
    expect(faq?.[1]?.answer).toContain("500 zł netto");
    expect(faq?.[1]?.answer).toContain("0 zł netto w 1. miesiącu");
    expect(faq?.[1]?.answer).toContain("200 zł netto w 2. miesiącu");
    expect(faq?.[1]?.answer).toContain("350 zł netto od 3. miesiąca");
    expect(page?.hero.lead).not.toContain("6 miesięcy");
    expect(page?.hero.lead).not.toContain("fakturę");
    expect((getKsefErpBySlug("comarch-erp-optima") as unknown as { switchOffer?: unknown })?.switchOffer).toBeUndefined();
  });
});
