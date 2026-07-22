import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
      <ModalProvider cases={cases} demos={demos}>
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
      // getByRole (not getByText): logoId demos (cadence, airlift) render a <DemoLogo> svg
      // instead of the literal name text — its role="img" aria-label still folds into the
      // heading's computed accessible name, so this assertion holds either way.
      expect(screen.getByRole("heading", { name: d.name })).toBeInTheDocument();
    }
  });

  it("does not render a non-featured demo on the homepage", () => {
    renderSection();

    const nonFeatured = getDemoBySlug("primavita")!;
    expect(site.featuredDemoSlugs).not.toContain(nonFeatured.slug);
    expect(screen.queryByText(nonFeatured.name)).not.toBeInTheDocument();
  });

  it("each featured card exposes a 'View details' control", () => {
    renderSection();

    for (const slug of site.featuredDemoSlugs) {
      const d = getDemoBySlug(slug)!;
      expect(
        screen.getByRole("button", { name: `Zobacz szczegóły: ${d.name}` }),
      ).toBeInTheDocument();
    }
  });

  it("each featured card exposes an external 'Open the demo' link to its own mockup", () => {
    renderSection();

    for (const slug of site.featuredDemoSlugs) {
      const d = getDemoBySlug(slug)!;
      const link = screen.getByRole("link", { name: `Otwórz demo: ${d.name}` });
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

  it("shows the desktop-only note once, for the featured HealthLab card only", () => {
    renderSection();

    expect(screen.getAllByText(site.sections.demos.desktopNote)).toHaveLength(1);
  });

  it("shows the language chip only for featured demos with uiLang 'en' (cadence, airlift), not healthlab", () => {
    renderSection();

    const enFeatured = site.featuredDemoSlugs
      .map((slug) => getDemoBySlug(slug)!)
      .filter((d) => d.uiLang === "en");
    expect(enFeatured).toHaveLength(2);
    expect(screen.getAllByText(site.sections.demos.langChip)).toHaveLength(enFeatured.length);
  });

  it("renders the DemoLogo brand mark for featured demos with a logoId (cadence, airlift)", () => {
    renderSection();

    expect(screen.getByRole("img", { name: "Cadence" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "AIRLIFT" })).toBeInTheDocument();
  });
});
