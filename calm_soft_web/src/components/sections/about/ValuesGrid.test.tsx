import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ABOUT_VALUE_ICONS, type AboutValue } from "@/content/types";
import { ValuesGrid } from "./ValuesGrid";

// Fixture pokrywa WSZYSTKIE klucze ABOUT_VALUE_ICONS — lokalna mapa glifów w ValuesGrid musi
// mieć pokrycie 1:1 (brief #15; brak klucza = błąd typu Record, a ten test pilnuje renderu).
const VALUES: AboutValue[] = ABOUT_VALUE_ICONS.map((icon, index) => ({
  title: `Tytul ${index}`,
  text: `Opis wartosci ${index}`,
  icon,
}));

describe("ValuesGrid", () => {
  it("renderuje rzędy manifestu: idx 01–04 z indeksu, tytuł h3, tekst i glif dekoracyjny pod tekstem", () => {
    const { container, getAllByRole, getByRole, getByText } = render(
      <ValuesGrid values={VALUES} />,
    );
    expect(container.querySelector("ul.values-manifest[role='list']")).toBeTruthy();

    const items = getAllByRole("listitem");
    expect(items).toHaveLength(VALUES.length);

    VALUES.forEach((value, index) => {
      const item = items[index];
      const heading = getByRole("heading", { level: 3, name: value.title });
      expect(item.contains(heading)).toBe(true);
      expect(item.textContent).toContain(value.text);

      // Numeracja z indeksu rzędu, padded — dekoracyjna (aria-hidden), ale osiągalna tekstowo.
      expect(getByText(String(index + 1).padStart(2, "0")).closest("li")).toBe(item);

      // Glif: div aria-hidden wybrany kluczem `icon` — znaczenie niesie h3/akapit.
      expect(item.querySelector(`div.value-glyph--${value.icon}[aria-hidden='true']`)).toBeTruthy();
    });

    // Rzędy NIEklikalne — zero zagnieżdżonych elementów interaktywnych w środku.
    expect(container.querySelector("button, a, [role='link']")).toBeNull();
  });

  it("glif jakości niesie pseudokod terminala jako dekorację (stałe komponentu, nie copy z site.ts)", () => {
    const { container } = render(<ValuesGrid values={VALUES} />);
    const glyph = container.querySelector("div.value-glyph--quality");
    expect(glyph?.textContent).toContain("$ npm test");
    expect(glyph?.textContent).toContain("✓ all passed");
  });

  it("pusta tablica — blok się nie renderuje (wzorzec featuredCaseSlugs)", () => {
    const { container } = render(<ValuesGrid values={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
