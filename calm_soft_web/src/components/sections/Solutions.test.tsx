import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDemoBySlug } from "@/content/demos";
import { allSolutionLines, solutions } from "@/content/solutions";
import { site } from "@/content/site";
import { Solutions } from "./Solutions";

// No providers needed (SPEC §16): this section renders no CardActions/useModal client leaf —
// its only interactivity is the frozen CalendlyCta, which Demos.test.tsx also rendered bare.
describe("Solutions (2026-07-26 solutions restructure design)", () => {
  it("renders the section heading and lead", () => {
    render(<Solutions />);

    expect(
      screen.getByRole("heading", { name: new RegExp(solutions.home.line1) }),
    ).toBeInTheDocument();
    expect(screen.getByText(solutions.home.lead)).toBeInTheDocument();
  });

  it("renders all 4 solution lines with their home title and teaser", () => {
    render(<Solutions />);

    expect(allSolutionLines).toHaveLength(5);
    for (const line of allSolutionLines) {
      expect(screen.getByRole("heading", { name: line.homeTitle })).toBeInTheDocument();
      expect(screen.getByText(line.homeTeaser)).toBeInTheDocument();
    }
  });

  it("each tile links to its line's anchor on /demos/ with an accessible name built from content strings", () => {
    render(<Solutions />);

    for (const line of allSolutionLines) {
      const link = screen.getByRole("link", {
        name: `${line.homeTitle} — ${solutions.home.tileCta}`,
      });
      expect(link).toHaveAttribute("href", `/demos/#${line.slug}`);
    }
  });

  it("each tile shows the lead demo's screenshot, resolved by leadDemoSlug", () => {
    render(<Solutions />);

    for (const line of allSolutionLines) {
      const lead = getDemoBySlug(line.leadDemoSlug)!;
      expect(screen.getByAltText(lead.shotAlt)).toBeInTheDocument();
    }
  });

  it('the "see all" link points to /demos/', () => {
    render(<Solutions />);

    const link = screen.getByRole("link", { name: site.sections.demos.seeAllCta });
    expect(link).toHaveAttribute("href", "/demos/");
  });

  it("no longer renders a demo-detail button on the homepage", () => {
    render(<Solutions />);

    expect(
      screen.queryByRole("button", { name: new RegExp(site.sections.demos.detailCta) }),
    ).not.toBeInTheDocument();
  });
});
