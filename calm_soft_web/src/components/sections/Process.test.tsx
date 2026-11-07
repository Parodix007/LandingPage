import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { steps } from "@/content/steps";
import { Process } from "./Process";

// Sticky-stos zastępuje karuzelę: sekcja ma być statycznym porządkiem listy kroków
// (server component), bez kontrolek karuzeli. Klejenie weryfikują testy skryptów CSS.
describe("Process (sticky stack)", () => {
  it("renderuje wszystkie kroki jako elementy listy z numerem, tytułem i opisem", () => {
    const { getByRole, getAllByRole } = render(<Process />);

    expect(getByRole("region", { name: /Spokojnie, krok po kroku/ })).toBeTruthy();

    const items = getAllByRole("listitem");
    expect(items).toHaveLength(steps.length);

    for (const step of steps) {
      const item = items.find((el) => el.textContent?.includes(step.title));
      expect(item).toBeTruthy();
      expect(item?.textContent).toContain(step.number);
      expect(item?.textContent).toContain(step.description);
      if (step.badge) {
        expect(item?.textContent).toContain(step.badge);
      }
    }
  });

  it("każdy krok nosi klasę zaczepową stosu i strukturę karty", () => {
    const { getAllByRole } = render(<Process />);
    const items = getAllByRole("listitem");

    for (const item of items) {
      expect(item.className).toContain("stack-item");
      expect(item.className).toContain("card-host");
      expect(item.querySelector(".card-glow")).toBeTruthy();
      // SPEC 2026-11-06 §4.3: karta kroku = tło surface + obwódka (konwencja repo
      // `border border-border-08`). Bez obwódki krawędź nakładających się kart znikają.
      expect(item).toHaveClass("bg-surface", "border", "border-border-08");
    }
  });

  it("nie zawiera kontrolek ani semantyki karuzeli", () => {
    const { container, queryByRole, queryAllByRole } = render(<Process />);

    expect(queryByRole("button")).toBeNull();
    expect(queryAllByRole("group")).toHaveLength(0);
    expect(container.querySelector("[aria-roledescription]")).toBeNull();
  });
});
