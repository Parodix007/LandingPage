import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { services } from "@/content/services";
import { cases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { CaseStudies } from "./CaseStudies";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function renderSection() {
  render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases} demos={demos}>
        <CaseStudies />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("CaseStudies (HANDOFF §6/§7, SPEC §14.2, 2026-07-20 round2 polish)", () => {
  it("renders the section heading and all 3 featured cases resolved by slug (not index)", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: new RegExp(site.sections.cases.line1) }),
    ).toBeInTheDocument();

    expect(site.featuredCaseSlugs).toHaveLength(3);
    for (const slug of site.featuredCaseSlugs) {
      const c = getCaseBySlug(slug)!;
      expect(screen.getByText(c.headline)).toBeInTheDocument();
    }
  });

  it("does not render a non-featured case on the homepage", () => {
    renderSection();

    const nonFeatured = cases.find((c) => !site.featuredCaseSlugs.includes(c.slug));
    expect(nonFeatured).toBeDefined();
    expect(screen.queryByText(nonFeatured!.headline)).not.toBeInTheDocument();
  });

  it('the "See all case studies" link points to /work/', () => {
    renderSection();

    const link = screen.getByRole("link", { name: site.sections.cases.seeAllCta });
    expect(link).toHaveAttribute("href", "/work/");
  });

  it("clicking a featured card's 'Read the story' opens a dialog showing that case's headline", async () => {
    const user = userEvent.setup();
    renderSection();

    const featured = getCaseBySlug(site.featuredCaseSlugs[0])!;
    await user.click(
      screen.getByRole("button", { name: `Read the story: ${featured.client}` }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: featured.headline }),
    ).toBeInTheDocument();
  });

  it("case modal content exposes the challenge/approach/results copy and the CTA footer", async () => {
    const user = userEvent.setup();
    renderSection();

    const featured = getCaseBySlug(site.featuredCaseSlugs[0])!;
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
