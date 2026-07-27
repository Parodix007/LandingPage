import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { solutions } from "@/content/solutions";
import { SolutionsFilter, type SolutionsFilterGroup, type SolutionsFilterLine } from "./SolutionsFilter";

// Own, simple fixtures rather than real <SolutionLineBlock> output (SPEC §5 "W testach podajesz
// własne, proste node") — this component only cares about slug/kicker/node, so real production
// copy would just add noise. Filter labels (legend/countLabel/clearLabel) still come from
// src/content/solutions.ts — that import is the contract between filter and test.
const lineA: SolutionsFilterLine = { slug: "integracje", kicker: "Line A", node: <p>line-a</p> };
const lineB: SolutionsFilterLine = { slug: "automatyzacje", kicker: "Line B", node: <p>line-b</p> };
const lineC: SolutionsFilterLine = { slug: "migracje", kicker: "Line C", node: <p>line-c</p> };
const lineD: SolutionsFilterLine = { slug: "weterynaria", kicker: "Line D", node: <p>line-d</p> };
const lineE: SolutionsFilterLine = { slug: "kliniki-laboratoria", kicker: "Line E", node: <p>line-e</p> };

const groupOne: SolutionsFilterGroup = {
  slug: "group-one",
  eyebrow: "Group One",
  sub: "Sub one",
  tone: "accent",
  lines: [lineA, lineB, lineC],
};

const groupTwo: SolutionsFilterGroup = {
  slug: "group-two",
  eyebrow: "Group Two",
  sub: "Sub two",
  tone: "accent2",
  lines: [lineD, lineE],
};

const groups: SolutionsFilterGroup[] = [groupOne, groupTwo];
const TOTAL = groups.reduce((n, g) => n + g.lines.length, 0);

function renderFilter() {
  return render(<SolutionsFilter groups={groups} filters={solutions.page.filters} />);
}

describe("SolutionsFilter (2026-07-26 solutions-group-heading-and-filters design)", () => {
  it("renders every line by default with a full count and no clear button", () => {
    renderFilter();

    expect(screen.getByText("line-a")).toBeInTheDocument();
    expect(screen.getByText("line-b")).toBeInTheDocument();
    expect(screen.getByText("line-c")).toBeInTheDocument();
    expect(screen.getByText("line-d")).toBeInTheDocument();
    expect(screen.getByText("line-e")).toBeInTheDocument();
    expect(
      screen.getByText(`${TOTAL} / ${TOTAL} ${solutions.page.filters.countLabel}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: solutions.page.filters.clearLabel }),
    ).not.toBeInTheDocument();
  });

  it("filters down to a single selected line", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: lineA.kicker }));

    expect(screen.getByText("line-a")).toBeInTheDocument();
    expect(screen.queryByText("line-b")).not.toBeInTheDocument();
    expect(screen.queryByText("line-c")).not.toBeInTheDocument();
    expect(screen.queryByText("line-d")).not.toBeInTheDocument();
    expect(screen.queryByText("line-e")).not.toBeInTheDocument();
  });

  it("supports multi-select across two lines from different groups", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: lineA.kicker }));
    await user.click(screen.getByRole("button", { name: lineD.kicker }));

    expect(screen.getByText("line-a")).toBeInTheDocument();
    expect(screen.getByText("line-d")).toBeInTheDocument();
    expect(screen.queryByText("line-b")).not.toBeInTheDocument();
    expect(screen.queryByText("line-e")).not.toBeInTheDocument();
  });

  it("reflects selection via aria-pressed", async () => {
    const user = userEvent.setup();
    renderFilter();

    const chip = screen.getByRole("button", { name: lineA.kicker });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("announces the shown/total count through role=status", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: lineA.kicker }));
    await user.click(screen.getByRole("button", { name: lineD.kicker }));

    expect(screen.getByRole("status").textContent).toBe(
      `2 / ${TOTAL} ${solutions.page.filters.countLabel}`,
    );
  });

  it("clear all resets the filter and brings every line back", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: lineA.kicker }));
    expect(screen.queryByText("line-b")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: solutions.page.filters.clearLabel }));

    expect(screen.getByText("line-b")).toBeInTheDocument();
    expect(
      screen.getByText(`${TOTAL} / ${TOTAL} ${solutions.page.filters.countLabel}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: solutions.page.filters.clearLabel }),
    ).not.toBeInTheDocument();
  });

  it("hides a group heading once all of its lines are filtered out", async () => {
    const user = userEvent.setup();
    renderFilter();

    await user.click(screen.getByRole("button", { name: lineA.kicker }));

    expect(screen.getByRole("heading", { name: groupOne.eyebrow, level: 2 })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: groupTwo.eyebrow, level: 2 }),
    ).not.toBeInTheDocument();
  });
});
