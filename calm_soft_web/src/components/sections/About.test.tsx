import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { site } from "@/content/site";
import { stripEmphasis } from "@/components/ui/RichText";
import { About } from "./About";

// Kontrakt kompozycji (brief 3 + brief #12, spec 2026-11-07): wariant "long" dokłada ValuesGrid +
// TechStack pod kaflem; FactStrip oraz wspólny tile dotyczą obu wariantów.
describe("About (kontrakt kompozycji wariantów)", () => {
  const stats = site.about.stats ?? [];
  const values = site.about.values ?? [];

  it("variant=\"long\": sekcja #about zawiera pasek faktów, siatkę wartości i TechStack", () => {
    expect(stats.length).toBeGreaterThan(0);
    expect(values.length).toBeGreaterThan(0);

    const { container } = render(<About variant="long" />);
    const section = container.querySelector("section#about");
    expect(section).toBeTruthy();

    for (const stat of stats) {
      expect(section?.textContent).toContain(stat.value);
      expect(section?.textContent).toContain(stat.label);
    }

    for (const value of values) {
      expect(section?.textContent).toContain(value.title);
      expect(section?.textContent).toContain(stripEmphasis(value.text));
    }

    // TechStack reuse bez zmian — marka z aria-labelem (role="img").
    expect(section?.querySelector("svg[aria-label='React']")).toBeTruthy();
  });

  it("variant=\"short\": pasek faktów i piguły marek w kafel; brak values/TechStack w DOM", () => {
    const { container, queryByText } = render(<About variant="short" />);

    // Brief #12 (spec 2026-11-07): FactStrip siedzi wewnątrz tile również w wariancie "short"
    // (nad hairline na dole prawej połowy) — etykiety faktów są więc w DOM.
    for (const stat of stats) {
      expect(queryByText(stat.label)).not.toBeNull();
    }
    // Brief #12: pod opisem rzędy statycznych piguł marek (decorative li > span, bez interakcji).
    for (const item of [...site.about.experience.items, ...site.about.certifications.items]) {
      expect(queryByText(item.name)).not.toBeNull();
    }
    for (const value of values) {
      expect(queryByText(value.title)).toBeNull();
    }
    expect(container.querySelector("svg[aria-label='React']")).toBeNull();
  });
});

// Atrybuty ładowania zdjęcia (brief #6, audyt Lighthouse /o-mnie/): w wariancie "long"
// zdjęcie jest elementem LCP — musi być eager (bez loading) z fetchPriority="high"
// (React 19 camelCase; renderuje się jako atrybut fetchpriority). W wariancie "short"
// (strona główna) zdjęcie jest pod foldem — lazy pozostaje zaletą, bez fetchPriority.
// Brief #17: src per wariant — short → oryginał /about-photo.webp (lazy), long → mniejszy
// /about-photo-wide.webp (preload+LCP); patrz PHOTO_BY_VARIANT w About.tsx.
describe("About (atrybuty ładowania zdjęcia per wariant)", () => {
  it("variant=\"long\": img bez loading (eager) i z fetchPriority=\"high\"", () => {
    const { container } = render(<About variant="long" />);
    const img = container.querySelector<HTMLImageElement>("section#about img[src='/about-photo-wide.webp']");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("loading")).toBeNull();
    expect(img?.getAttribute("fetchpriority")).toBe("high");
  });

  it("variant=\"short\": img z loading=\"lazy\" i bez fetchPriority", () => {
    const { container } = render(<About variant="short" />);
    const img = container.querySelector<HTMLImageElement>("section#about img[src='/about-photo.webp']");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("fetchpriority")).toBeNull();
  });
});

// Struktura kafla (brief #12, spec 2026-11-07): oba warianty renderują JEDEN tile card-host —
// zdjęcie full-bleed (komórka lewa, img absolute inset-0) i tekst w tym samym kafel
// (img.closest(".card-host") === panel z tekstem, a w sekcji jest dokładnie jeden .card-host —
// FactStrip/ValuesGrid/TechStack nie używają tej klasy). Mobile: zdjęcie nad treścią (DOM-first).
describe("About (jeden tile card-host w obu wariantach)", () => {
  it("variant=\"long\": zdjęcie i tekst w tym samym panelu card-host", () => {
    const { container } = render(<About variant="long" />);
    const section = container.querySelector("section#about");
    expect(section).toBeTruthy();

    const panels = section?.querySelectorAll("div.card-host") ?? [];
    expect(panels).toHaveLength(1);

    const img = section?.querySelector<HTMLImageElement>("img[src='/about-photo-wide.webp']");
    expect(img).toBeTruthy();
    const panel = img?.closest("div.card-host");
    expect(panel).toBeTruthy();
    expect(panel).toBe(panels[0]);
    expect(panel?.textContent).toContain(stripEmphasis(site.about.long[0]));
  });

  it("variant=\"short\": zdjęcie i tekst w tym samym panelu card-host", () => {
    const { container } = render(<About variant="short" />);
    const section = container.querySelector("section#about");
    expect(section).toBeTruthy();

    const panels = section?.querySelectorAll("div.card-host") ?? [];
    expect(panels).toHaveLength(1);

    const img = section?.querySelector<HTMLImageElement>("img[src='/about-photo.webp']");
    expect(img).toBeTruthy();
    const panel = img?.closest("div.card-host");
    expect(panel).toBeTruthy();
    expect(panel).toBe(panels[0]);
    expect(panel?.textContent).toContain(stripEmphasis(site.about.short));
  });
});
