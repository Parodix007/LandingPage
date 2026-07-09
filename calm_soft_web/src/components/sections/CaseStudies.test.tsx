import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { services } from "@/content/services";
import { cases, getCaseBySlug } from "@/content/cases";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { CaseStudies } from "./CaseStudies";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function renderSection() {
  render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases}>
        <CaseStudies />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("CaseStudies (HANDOFF §6/§7, SPEC §14.2)", () => {
  it("renders the section heading and the featured case resolved by slug (not index)", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: new RegExp(site.sections.cases.line1) }),
    ).toBeInTheDocument();

    const featured = getCaseBySlug(site.featuredCaseSlug)!;
    expect(screen.getByText(featured.headline)).toBeInTheDocument();
  });

  it("renders the other 5 cases (excluding the featured slug) in the grid", () => {
    renderSection();

    const gridCases = cases.filter((c) => c.slug !== site.featuredCaseSlug);
    expect(gridCases).toHaveLength(cases.length - 1);
    for (const c of gridCases) {
      expect(screen.getByText(c.headline)).toBeInTheDocument();
    }
  });

  it("clicking the featured card's 'Read the story' opens a dialog showing that case's headline", async () => {
    const user = userEvent.setup();
    renderSection();

    const featured = getCaseBySlug(site.featuredCaseSlug)!;
    await user.click(
      screen.getByRole("button", { name: `Read the story: ${featured.client}` }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: featured.headline }),
    ).toBeInTheDocument();
  });

  it("clicking a grid card's 'Read the story' opens a dialog showing that case's headline", async () => {
    const user = userEvent.setup();
    renderSection();

    const gridCase = cases.find((c) => c.slug !== site.featuredCaseSlug)!;
    await user.click(
      screen.getByRole("button", { name: `Read the story: ${gridCase.client}` }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: gridCase.headline }),
    ).toBeInTheDocument();
  });

  it("case modal content exposes the challenge/approach/results copy and the CTA footer", async () => {
    const user = userEvent.setup();
    renderSection();

    const featured = getCaseBySlug(site.featuredCaseSlug)!;
    await user.click(
      screen.getByRole("button", { name: `Read the story: ${featured.client}` }),
    );

    expect(screen.getByText(featured.challenge)).toBeInTheDocument();
    expect(screen.getByText(featured.approach)).toBeInTheDocument();
    expect(screen.getByText(featured.results)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start a similar project ›" }),
    ).toBeInTheDocument();
    expect(screen.getByText(site.modals.caseNote)).toBeInTheDocument();
  });
});
