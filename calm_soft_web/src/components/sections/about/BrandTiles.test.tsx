import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BrandTilesGroup } from "@/content/types";
import { BrandTiles } from "./BrandTiles";

// Fixture odwzorowuje zatwierdzone dane site.about.certifications (brief #12, tabela kolorów
// speca 2026-11-07) w wersji skróconej — wartości CSS nie są przedmiotem asercji.
const GROUP: BrandTilesGroup = {
  label: "Certyfikacje:",
  columns: 4,
  items: [
    {
      name: "Microsoft",
      border: "rgba(255,255,255,.16)",
      wash: "linear-gradient(to right, rgba(16,18,20,.96) 40%, rgba(255,185,0,.14))",
      glow: "rgba(255,185,0,.18)",
      mark: "microsoft",
    },
    {
      name: "LPI",
      border: "rgba(251,192,0,.45)",
      wash: "linear-gradient(135deg, rgba(251,192,0,.42), rgba(24,20,8,.92))",
      glow: "rgba(251,192,0,.26)",
      titleColor: "#f5edd9",
    },
  ],
};

describe("BrandTiles", () => {
  it("pusty items — blok się nie renderuje (wzorzec featuredCaseSlugs)", () => {
    const { container } = render(
      <BrandTiles group={{ label: "Certyfikacje:", columns: 2, items: [] }} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renderuje nadpisek, nazwy (uppercase klasą) i kafle z data-glow", () => {
    const { container, getByRole, getByText, getAllByRole } = render(<BrandTiles group={GROUP} />);

    expect(getByRole("list")).toBeTruthy(); // ul role="list" (jw. listitem)
    expect(getByText(GROUP.label)).toBeTruthy();
    const items = getAllByRole("listitem");
    expect(items).toHaveLength(GROUP.items.length);
    // Kafel-li nosi atrybut poświaty (PointerFx rozwiązuje --mx/--my właśnie na [data-glow]).
    expect(items[0]).toHaveAttribute("data-glow");

    GROUP.items.forEach((tile, index) => {
      const item = items[index];
      // Nazwa w naturalnej formie w DOM — uppercase robi klasa CSS (brief #12).
      const name = getByText(tile.name);
      expect(name).toHaveClass("uppercase");
      expect(item.contains(name)).toBe(true);
      // Dekoracyjna poświata: .card-glow z aria-hidden — znaczenie niesie nazwa kafla.
      const glow = item.querySelector("span.card-glow[aria-hidden='true']");
      expect(glow).toBeTruthy();
      // jsdom nie zwraca zmiennych custom w getComputedStyle — czytamy wprost z inline style.
      expect((glow as HTMLElement).style.getPropertyValue("--glow-color")).toBe(tile.glow);
    });

    // titleColor tylko tam, gdzie dane go podają (LPI).
    expect(getByText("LPI")).toHaveStyle({ color: "#f5edd9" });
    expect(getByText("Microsoft")).not.toHaveStyle({ color: "#f5edd9" });

    // Kafle NIEklikalne — zero elementów interaktywnych w środku.
    expect(container.querySelector("button, a, [role='link']")).toBeNull();
  });

  it("Microsoft mark — okienko aria-hidden z czterema spanami w barwach marki", () => {
    const { container } = render(<BrandTiles group={GROUP} />);
    const mark = container.querySelector("span.ms-mark[aria-hidden='true']");
    expect(mark).toBeTruthy();
    const quads = Array.from(mark!.querySelectorAll("span"));
    expect(quads).toHaveLength(4);
    expect(quads.map((q) => q.style.background)).toEqual([
      "rgb(242, 80, 34)",
      "rgb(127, 186, 0)",
      "rgb(0, 164, 239)",
      "rgb(255, 185, 0)",
    ]);
    // Pozostałe kafle bez geometrii markowych — nazwy pracodawców wyłącznie tekstowo.
    expect(container.querySelectorAll(".ms-mark")).toHaveLength(1);
  });
});
