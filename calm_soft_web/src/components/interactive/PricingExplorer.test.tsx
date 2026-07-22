import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { pricing } from "@/content/pricing";
import { PricingExplorer } from "./PricingExplorer";

function renderExplorer() {
  return render(<PricingExplorer groups={pricing.groups} filters={pricing.filters} />);
}

const TOTAL = pricing.groups.reduce((n, g) => n + g.cards.length, 0);

const startGroup = pricing.groups.find((g) => g.eyebrow === "Zacznij bez ryzyka")!;
const automationGroup = pricing.groups.find((g) => g.eyebrow === "Automatyzacja")!;
const coreGroup = pricing.groups.find((g) => g.eyebrow === "Systemy centralne i integracje")!;
const refactorGroup = pricing.groups.find((g) => g.eyebrow === "Refactor & rescue")!;
const maintenanceGroup = pricing.groups.find((g) => g.eyebrow === "Utrzymanie po wdrożeniu")!;

const highTier = pricing.filters.tiers.find((t) => t.id === "high")!;

describe("PricingExplorer (2026-07-22 pl-copy handoff)", () => {
  it("renders every card initially with a full result count", () => {
    renderExplorer();

    expect(
      screen.getByText(`${TOTAL} / ${TOTAL} ${pricing.filters.countLabel}`),
    ).toBeInTheDocument();
    expect(screen.getByText(startGroup.cards[0].title)).toBeInTheDocument();
    expect(screen.getByText(coreGroup.cards[0].title)).toBeInTheDocument();
    expect(screen.getByText(refactorGroup.cards[1].title)).toBeInTheDocument();
  });

  it("filters cards down to the selected category", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: new RegExp(automationGroup.eyebrow) }));

    expect(screen.getByText(automationGroup.cards[0].title)).toBeInTheDocument();
    expect(screen.queryByText(startGroup.cards[0].title)).not.toBeInTheDocument();
  });

  it("filters cards down to the selected price tier", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: highTier.label }));

    // Modernizacja / migracja systemu legacy (24 000 zł) and Zaawansowany system automatyzacji
    // / AI (18 000 zł) both fall in the "high" (15k+) tier.
    expect(screen.getByText(refactorGroup.cards[1].title)).toBeInTheDocument();
    expect(screen.getByText(automationGroup.cards[2].title)).toBeInTheDocument();
    expect(screen.queryByText(startGroup.cards[0].title)).not.toBeInTheDocument();
  });

  it("combines category and price tier filters with AND semantics", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: new RegExp(automationGroup.eyebrow) }));
    await user.click(screen.getByRole("button", { name: highTier.label }));

    expect(screen.getByText(automationGroup.cards[2].title)).toBeInTheDocument();
    expect(screen.queryByText(automationGroup.cards[0].title)).not.toBeInTheDocument();
  });

  it("clear all resets the filters and brings hidden cards back", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: new RegExp(automationGroup.eyebrow) }));
    expect(screen.queryByText(startGroup.cards[0].title)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: pricing.filters.clearLabel }));

    expect(screen.getByText(startGroup.cards[0].title)).toBeInTheDocument();
    expect(
      screen.getByText(`${TOTAL} / ${TOTAL} ${pricing.filters.countLabel}`),
    ).toBeInTheDocument();
  });

  it("shows the empty state when the combined filters match no card", async () => {
    const user = userEvent.setup();
    renderExplorer();

    // Maintenance ("Utrzymanie po wdrożeniu") has no card priced at the "high" (15k+) tier.
    await user.click(screen.getByRole("button", { name: new RegExp(maintenanceGroup.eyebrow) }));
    await user.click(screen.getByRole("button", { name: highTier.label }));

    expect(screen.getByText(pricing.filters.emptyTitle)).toBeInTheDocument();
  });

  it('renders "od" (not "from") as the price-point chrome word', () => {
    renderExplorer();

    expect(screen.getAllByText("od").length).toBeGreaterThan(0);
    expect(screen.queryByText("from")).not.toBeInTheDocument();
  });
});
