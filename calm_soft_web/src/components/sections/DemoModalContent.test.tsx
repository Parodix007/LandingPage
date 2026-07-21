import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demos, getDemoBySlug } from "@/content/demos";
import { site } from "@/content/site";
import { DemoModalContent } from "./DemoModalContent";

describe("DemoModalContent (2026-07-20 demo-detail-modal-and-demos-subpage design doc)", () => {
  it("renders the demo's tagline as the #modal-headline", () => {
    render(<DemoModalContent demo={demos[0]} />);

    const headline = screen.getByRole("heading", { name: demos[0].tagline });
    expect(headline).toHaveAttribute("id", "modal-headline");
  });

  it("renders every key-flow feature", () => {
    render(<DemoModalContent demo={demos[0]} />);

    for (const feature of demos[0].features) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });

  it("the live-demo link opens the mockup safely in a new tab", () => {
    render(<DemoModalContent demo={demos[0]} />);

    const link = screen.getByRole("link", { name: site.sections.demos.liveCta });
    expect(link).toHaveAttribute("href", "/demo/merdi/index.html");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("renders a lazy, alt-labelled screenshot of the mockup", () => {
    render(<DemoModalContent demo={demos[0]} />);

    const img = screen.getByAltText(demos[0].shotAlt);
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders the shared technology-stack row under the techLegend heading", () => {
    render(<DemoModalContent demo={demos[0]} />);

    expect(screen.getByText(site.sections.demos.techLegend)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "React" })).toBeInTheDocument();
  });

  it("shows the demo best-practices note", () => {
    render(<DemoModalContent demo={demos[0]} />);

    expect(screen.getByText(site.modals.demoNote)).toBeInTheDocument();
  });

  it("shows the desktop-only note for a desktopOnly demo (HealthLab)", () => {
    const healthlab = getDemoBySlug("healthlab")!;
    render(<DemoModalContent demo={healthlab} />);

    expect(screen.getByText(site.sections.demos.desktopNote)).toBeInTheDocument();
  });

  it("hides the desktop-only note for a responsive demo (Merdi)", () => {
    render(<DemoModalContent demo={demos[0]} />);

    expect(screen.queryByText(site.sections.demos.desktopNote)).not.toBeInTheDocument();
  });
});
