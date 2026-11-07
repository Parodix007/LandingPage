import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AboutStat } from "@/content/types";
import { FactStrip } from "./FactStrip";

// Fixture propsów — FactStrip nie zna contentu; copy płynie wyłącznie przez propsy (brief 3).
const STATS: AboutStat[] = [
  { value: "10 lat", label: "praktyki komercyjnej" },
  { value: "25", label: "systemów na produkcji" },
  { value: "8", label: "integracji z ERP" },
  { value: "1 h", label: "maksymalny czas pierwszej odpowiedzi" },
];

describe("FactStrip", () => {
  it("renderuje wszystkie wpisy jako listę z wartością i etykietą", () => {
    const { getByRole, getAllByRole } = render(<FactStrip stats={STATS} />);

    const list = getByRole("list");
    const items = getAllByRole("listitem");
    expect(items).toHaveLength(STATS.length);

    for (const stat of STATS) {
      expect(list.textContent).toContain(stat.value);
      expect(list.textContent).toContain(stat.label);
    }

    // Liczby w mono (wzorzec eyebrow/mono repo), etykiety w ink-70 — kontrakt briefu 3.
    for (const item of items) {
      expect(item.querySelector("span.font-mono")).toBeTruthy();
      expect(item.querySelector("span.text-ink-70")).toBeTruthy();
    }
  });

  it("pusta tablica — blok się nie renderuje (wzorzec featuredCaseSlugs)", () => {
    const { container } = render(<FactStrip stats={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
