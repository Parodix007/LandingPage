import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { services } from "@/content/services";
import { cases } from "@/content/cases";
import { demos, getDemoBySlug } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Demos } from "./Demos";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function renderSection() {
  render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases} demos={demos}>
        <Demos />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("Demos (2026-07-20 demo-detail-modal-and-demos-subpage design doc)", () => {
  it("renders the section heading and all 3 featured demos resolved by slug (not index)", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: new RegExp(site.sections.demos.line1) }),
    ).toBeInTheDocument();

    expect(site.featuredDemoSlugs).toHaveLength(3);
    for (const slug of site.featuredDemoSlugs) {
      const d = getDemoBySlug(slug)!;
      expect(screen.getByText(d.name)).toBeInTheDocument();
    }
  });

  it("does not render a non-featured demo on the homepage", () => {
    renderSection();

    const nonFeatured = demos.find((d) => !site.featuredDemoSlugs.includes(d.slug));
    expect(nonFeatured).toBeDefined();
    expect(nonFeatured!.name).toBe("Primavita");
    expect(screen.queryByText(nonFeatured!.name)).not.toBeInTheDocument();
  });

  it("each featured card exposes a 'View details' control", () => {
    renderSection();

    for (const slug of site.featuredDemoSlugs) {
      const d = getDemoBySlug(slug)!;
      expect(
        screen.getByRole("button", { name: `View ${d.name} details` }),
      ).toBeInTheDocument();
    }
  });

  it("each featured card exposes an external 'Open the demo' link to its own mockup", () => {
    renderSection();

    for (const slug of site.featuredDemoSlugs) {
      const d = getDemoBySlug(slug)!;
      const link = screen.getByRole("link", { name: `Open the demo: ${d.name}` });
      expect(link).toHaveAttribute("href", d.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it('the "See all demos" link points to /demos/', () => {
    renderSection();

    const link = screen.getByRole("link", { name: site.sections.demos.seeAllCta });
    expect(link).toHaveAttribute("href", "/demos/");
  });
});
