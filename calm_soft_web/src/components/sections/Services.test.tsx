import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Services } from "./Services";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function renderServices() {
  return render(
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <Services />
      </ModalProvider>
    </InquiryProvider>,
  );
}

// Section-level test, kept light: the slider's own carousel/content behavior is covered in
// depth by ServicesSlider.test.tsx (docs/superpowers/specs/2026-07-22-services-slider-design.md).
describe("Services section (2026-07-22 services-slider design)", () => {
  it("renders the section heading with the new copy (line1 + line2)", () => {
    renderServices();

    const heading = screen.getByRole("heading", {
      name: new RegExp(site.sections.services.line1),
    });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(site.sections.services.line2)).toBeInTheDocument();
  });

  it("renders the services track with all 4 slides", () => {
    const { container } = renderServices();

    const track = container.querySelector('[data-testid="services-track"]');
    expect(track).toBeInTheDocument();
    expect(
      container.querySelectorAll('[role="group"][aria-roledescription="slide"]'),
    ).toHaveLength(4);
  });

  it("renders the pricing strip prompt and a link to /pricing/", () => {
    renderServices();

    expect(screen.getByText(site.sections.services.pricingPrompt)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: site.sections.services.pricingCta });
    expect(link).toHaveAttribute("href", "/pricing/");
  });

  it("clicking the active tile's CTA does not open a dialog and scrolls to contact", async () => {
    const { scrollToContact } = await import("@/lib/scroll");
    const user = userEvent.setup();
    renderServices();

    const ctaButtons = screen.getAllByRole("button", {
      name: site.sections.services.cta,
      hidden: true,
    });
    await user.click(ctaButtons[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(scrollToContact).toHaveBeenCalledTimes(1);
  });
});
