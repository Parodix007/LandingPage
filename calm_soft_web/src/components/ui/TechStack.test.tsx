import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechStack } from "./TechStack";

// Kontrakt briefu #14 (spec 2026-11-07, makieta tech-marquee-real): marquee 12 marek —
// oryginały (role="img", aria-label, <title>, fill = oficjalny hex marki) + drugi komplet
// do pętli CSS (li[aria-hidden], svg aria-hidden bez role/labela/title — bez dublowania
// nazw dla AT). withNames dokłada nazwę w odcieniu nameColor (kontrast AA na dark surface).
const MARKS: ReadonlyArray<{ name: string; hex: string; nameColor: string }> = [
  { name: "Angular", hex: "#dd0031", nameColor: "#ef4a6d" },
  { name: "React", hex: "#61dafb", nameColor: "#61dafb" },
  { name: "Next.js", hex: "#ededed", nameColor: "#ededed" }, // near-white (znak marki czarny)
  { name: "Nest.js", hex: "#e10000", nameColor: "#ff6a5c" },
  { name: "Fastify", hex: "#ededed", nameColor: "#ededed" }, // near-white (znak marki czarny)
  { name: "Spring Boot", hex: "#6db33f", nameColor: "#6db33f" },
  { name: "MySQL", hex: "#4479a1", nameColor: "#5c9fd4" },
  { name: "PostgreSQL", hex: "#336791", nameColor: "#6ea2d6" },
  { name: "n8n", hex: "#ea4b71", nameColor: "#ea4b71" },
  { name: "Make", hex: "#6d00cc", nameColor: "#a86aff" },
  { name: "Power Automate", hex: "#006cbe", nameColor: "#4da3e8" },
  { name: "Zapier", hex: "#ff4f00", nameColor: "#ff4f00" },
];

// jsdom normalizuje kolor CSS do rgb() — hex z danych porównujemy po normalizacji.
function rgb(hex: string): string {
  const n = Number(`0x${hex.slice(1)}`);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe("TechStack (brief #14)", () => {
  it("12 oryginałów + 12 duplikatów do pętli CSS — łącznie 24 svg", () => {
    const { container } = render(<TechStack />);
    expect(container.querySelectorAll("svg")).toHaveLength(24);
    const dupLis = container.querySelectorAll('li[aria-hidden="true"]');
    expect(dupLis).toHaveLength(12);
    // duplikaty są przezroczyste dla AT: bez role="img", aria-label i <title>
    expect(
      container.querySelectorAll(
        'li[aria-hidden="true"] svg[role="img"], li[aria-hidden="true"] svg[aria-label], li[aria-hidden="true"] title'
      )
    ).toHaveLength(0);
    // każdy oryginał ma dokładnie jeden dostępny obraz o nazwie marki (duplikat się nie liczy)
    for (const { name } of MARKS) {
      expect(screen.getAllByRole("img", { name })).toHaveLength(1);
    }
  });

  it("wypełnienie oryginałów to oficjalny hex marki", () => {
    render(<TechStack />);
    for (const { name, hex } of MARKS) {
      expect(screen.getByRole("img", { name })).toHaveAttribute("fill", hex);
    }
  });

  it("withNames: 12 nazw oryginałów w kolorze nameColor", () => {
    const { container } = render(<TechStack withNames />);
    expect(container.querySelectorAll('li:not([aria-hidden="true"]) span')).toHaveLength(12);
    for (const { name, nameColor } of MARKS) {
      const li = screen.getByRole("img", { name }).closest("li");
      const span = li?.querySelector("span");
      expect(span).not.toBeNull();
      expect(span).toHaveTextContent(name);
      expect(span).toHaveStyle({ color: rgb(nameColor) });
    }
  });

  it("bez withNames (modal dema): zero nazw w DOM", () => {
    const { container } = render(<TechStack />);
    expect(container.querySelectorAll("li span")).toHaveLength(0);
  });
});
