import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { pricing } from "@/content/pricing";
import { PricingExplorer } from "./PricingExplorer";

function renderExplorer() {
  return render(<PricingExplorer groups={pricing.groups} filters={pricing.filters} />);
}

describe("PricingExplorer", () => {
  it("renders every card initially with a full result count", () => {
    renderExplorer();

    expect(screen.getByText("18 / 18 shown")).toBeInTheDocument();
    expect(screen.getByText("Intro call (30 min)")).toBeInTheDocument();
    expect(
      screen.getByText("B2B integrations / distributed systems / event-driven"),
    ).toBeInTheDocument();
    expect(screen.getByText("Legacy system modernization / migration")).toBeInTheDocument();
  });

  it("filters cards down to the selected category", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: /Automation/ }));

    expect(screen.getByText("Simple automation")).toBeInTheDocument();
    expect(screen.queryByText("Intro call (30 min)")).not.toBeInTheDocument();
  });

  it("filters cards down to the selected price tier", async () => {
    const user = userEvent.setup();
    renderExplorer();

    // Anchor on the trailing "+" — "PLN 5–15k" also contains the substring "15k".
    await user.click(screen.getByRole("button", { name: /15k\+/ }));

    expect(screen.getByText("Legacy system modernization / migration")).toBeInTheDocument();
    expect(screen.getByText("Advanced automation / AI system")).toBeInTheDocument();
    expect(screen.queryByText("Intro call (30 min)")).not.toBeInTheDocument();
  });

  it("combines category and price tier filters with AND semantics", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: /Automation/ }));
    await user.click(screen.getByRole("button", { name: /15k\+/ }));

    expect(screen.getByText("Advanced automation / AI system")).toBeInTheDocument();
    expect(screen.queryByText("Simple automation")).not.toBeInTheDocument();
  });

  it("clear all resets the filters and brings hidden cards back", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("button", { name: /Automation/ }));
    expect(screen.queryByText("Intro call (30 min)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.getByText("Intro call (30 min)")).toBeInTheDocument();
    expect(screen.getByText("18 / 18 shown")).toBeInTheDocument();
  });

  it("shows the empty state when the combined filters match no card", async () => {
    const user = userEvent.setup();
    renderExplorer();

    // Post-launch maintenance has no card priced at PLN 15k+.
    await user.click(screen.getByRole("button", { name: /Post-launch/ }));
    await user.click(screen.getByRole("button", { name: /15k\+/ }));

    expect(screen.getByText(pricing.filters.emptyTitle)).toBeInTheDocument();
  });
});
