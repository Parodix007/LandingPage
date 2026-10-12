import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getKsefErpBySlug } from "@/content/ksef";
import { KsefPricingTable } from "./KsefPricingTable";

vi.mock("@/components/interactive/KsefPlanCta", () => ({
  KsefPlanCta: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

describe("KsefPricingTable dla Rachmistrza Nexo", () => {
  it("renderuje prawdziwe warianty desktop i mobile z cenami Nexo", () => {
    const page = getKsefErpBySlug("rachmistrz-nexo");

    expect(page).toBeDefined();
    render(<KsefPricingTable pricing={page!.pricing} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(document.querySelectorAll("article")).toHaveLength(2);
    expect(screen.getAllByText("350 zł")).toHaveLength(2);
    expect(screen.getAllByText("od 699 zł")).toHaveLength(2);
    expect(document.querySelectorAll('[data-plan="firma"]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-plan="pro"]').length).toBeGreaterThan(0);
    expect(screen.getAllByText("PRO").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Polecany").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Wybieram Standard" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Dobierz wariant PRO" })).toHaveLength(2);
  });
});
