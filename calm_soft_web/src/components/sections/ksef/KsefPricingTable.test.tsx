import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ksef } from "@/content/ksef";
import { KsefPricingTable } from "./KsefPricingTable";

vi.mock("@/components/interactive/KsefPlanCta", () => ({
  KsefPlanCta: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

describe("KsefPricingTable", () => {
  it("renderuje tabelę desktop i karty mobile z hookami CSS dla obu planów", () => {
    render(<KsefPricingTable pricing={ksef.erps[0]!.pricing} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    const mobileCards = [...document.querySelectorAll("article")];
    expect(mobileCards).toHaveLength(2);
    for (const card of mobileCards) {
      for (const label of ["Wsparcie techniczne", "Obsługa starszych wersji Optimy", "Aktualizacje i utrzymanie", "Monitoring działania"]) {
        expect(card.textContent).toContain(label);
      }
    }
    expect(document.querySelectorAll('[data-plan="firma"]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-plan="pro"]').length).toBeGreaterThan(0);
    expect(screen.getAllByText("PRO").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Polecany").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Wybieram Standard" }).length).toBe(2);
    expect(screen.getAllByRole("button", { name: "Dobierz wariant PRO" }).length).toBe(2);
  });

  it("ma wspólny hook geometrii kolumny dla hovera Standard i wyróżnionego PRO", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain('.ksef-plan-table:has([data-plan="firma"]:hover) th[data-plan="firma"]');
    expect(css).toContain("inset 0 1px 0");
    expect(css).toContain("inset 1px 0 0");
    expect(css).toContain("inset -1px 0 0");
    expect(css).not.toContain('.ksef-plan-table:has([data-plan="pro"]:hover) th[data-plan="pro"]');
    expect(css).not.toContain('.ksef-plan-table:has([data-plan="pro"]:hover) td[data-plan="pro"]');
  });

  it("renderuje dostępny opis warunków PRO w obu wariantach cennika", () => {
    const note = "Zarezerwowany zakres obowiązuje w danym okresie rozliczeniowym i nie przechodzi na kolejne okresy. Większe prace i dodatkowy zakres ustalam przed rozpoczęciem realizacji.";
    render(<KsefPricingTable pricing={ksef.erps[0]!.pricing} />);

    const triggers = screen.getAllByRole("button", { name: "Warunki planu PRO" });
    const tooltips = screen.getAllByRole("tooltip");
    expect(triggers).toHaveLength(2);
    expect(tooltips).toHaveLength(2);
    for (const [index, trigger] of triggers.entries()) {
      const tooltipId = trigger.getAttribute("aria-describedby");
      expect(tooltipId).toBeTruthy();
      expect(tooltipId).toBe(tooltips[index]?.id);
      expect(tooltips[index]?.textContent).toBe(note);
      expect(tooltips[index]?.className).toContain("invisible");
      expect(tooltips[index]?.className).toContain("group-hover:visible");
      expect(tooltips[index]?.className).toContain("group-focus-within:visible");
    }
  });

  it("utrzymuje geometrię nazw planów i placement tooltipów w viewportach", () => {
    render(<KsefPricingTable pricing={ksef.erps[0]!.pricing} />);

    for (const name of ["Standard", "PRO"]) {
      for (const heading of screen.getAllByRole("heading", { name })) {
        expect(heading.parentElement?.className).toContain("min-h-11");
      }
    }

    const desktopTooltip = document.getElementById("ksef-pro-note-desktop");
    const mobileTooltip = document.getElementById("ksef-pro-note-mobile");
    expect(desktopTooltip?.className).toContain("right-0");
    expect(desktopTooltip?.className).toContain("left-auto");
    expect(desktopTooltip?.className).not.toContain("left-1/2");
    expect(desktopTooltip?.className).not.toContain("-translate-x-1/2");
    expect(mobileTooltip?.className).toContain("left-0");
    expect(mobileTooltip?.className).not.toContain("left-1/2");
    expect(mobileTooltip?.className).not.toContain("-translate-x-1/2");
    expect(desktopTooltip?.className).toContain("motion-reduce:transition-none");
    expect(mobileTooltip?.className).toContain("motion-reduce:transition-none");
  });

  it("kotwiczy mobilny tooltip do pełnego wrappera nazwy i zachowuje bezpieczną szerokość", () => {
    render(<KsefPricingTable pricing={ksef.erps[0]!.pricing} />);

    const audience = "Dla firm, które regularnie rozwijają rozwiązanie i chcą mieć zarezerwowany czas na zmiany.";
    const mobileAudience = [...document.querySelectorAll("p")].filter((block) => block.textContent?.startsWith(audience))[1];
    expect(mobileAudience?.className).toContain("relative");
    expect(mobileAudience?.querySelector(".group")?.className).not.toContain("relative");

    const mobileTooltip = document.getElementById("ksef-pro-note-mobile");
    expect(mobileTooltip?.className).toContain("max-w-[min(18rem,calc(100vw-6rem))]");
  });

  it("umieszcza hint PRO przy odbiorcy i używa małej wspólnej ikony informacji", () => {
    render(<KsefPricingTable pricing={ksef.erps[0]!.pricing} />);

    const audience = "Dla firm, które regularnie rozwijają rozwiązanie i chcą mieć zarezerwowany czas na zmiany.";
    const audienceBlocks = [...document.querySelectorAll("p")].filter((block) => block.textContent?.startsWith(audience));
    expect(audienceBlocks).toHaveLength(2);
    for (const block of audienceBlocks) {
      const trigger = block.querySelector('button[aria-label="Warunki planu PRO"]');
      expect(trigger).not.toBeNull();
      expect(trigger?.className).toContain("hit-44");
      expect(trigger?.className).not.toContain("min-h-11");
      expect(trigger?.className).not.toContain("min-w-11");
      expect(trigger?.className).toContain("h-4");
      expect(trigger?.className).toContain("w-4");
      expect(trigger?.querySelector("svg")).not.toBeNull();
      expect(trigger?.querySelector("svg")?.className.baseVal).toContain("h-4");
      expect(trigger?.querySelector("svg")?.className.baseVal).toContain("w-4");
      expect(trigger?.querySelector("span")?.textContent).not.toBe("i");
    }

    for (const heading of screen.getAllByRole("heading", { name: "PRO" })) {
      expect(heading.parentElement?.querySelector('button[aria-label="Warunki planu PRO"]')).toBeNull();
    }

    const source = readFileSync("src/components/sections/ksef/KsefPricingTable.tsx", "utf8");
    expect(source).toContain("InfoIcon");
    const iconsSource = readFileSync("src/components/ui/icons.tsx", "utf8");
    expect(iconsSource).toContain('<circle cx="12" cy="12" r="10" />');
  });
});
