import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getKsefErpBySlug } from "@/content/ksef";
import { KsefSwitchOffer } from "./KsefSwitchOffer";

vi.mock("@/components/providers/InquiryProvider", () => ({
  useInquiry: () => ({
    prefillContactMessage: vi.fn(),
    requestContactScroll: vi.fn(),
    focusContactField: vi.fn(),
  }),
}));

const page = getKsefErpBySlug("rachmistrz-nexo")!;
const offer = page.switchOffer!;
const contactHref = page.contactHref;

describe("KsefSwitchOffer", () => {
  it("renderuje kompaktowy baner produktu i CTA do kontaktu", () => {
    render(<KsefSwitchOffer offer={offer} contactHref={contactHref} variant="compact" />);

    expect(screen.getByText(offer.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(/Masz już kupione InsPunkty/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: offer.cta })).toHaveAttribute("href", offer.entryHref);
    expect(screen.getByRole("link", { name: offer.conditionsLinkLabel })).toHaveAttribute("href", offer.conditionsHref);
    expect(document.querySelector("#nexo-switch-banner")).toBeInTheDocument();
  });

  it("renderuje krótkie przypomnienie przy cenniku i link do pełnych warunków", () => {
    render(<KsefSwitchOffer offer={offer} contactHref={contactHref} prefill={offer.prefill} variant="pricing" />);

    expect(screen.getByRole("heading", { level: 3, name: offer.pricingTitle })).toBeInTheDocument();
    expect(screen.getByText(offer.pricingBody)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: offer.cta })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: offer.conditionsLinkLabel })).toHaveAttribute("href", offer.conditionsHref);
    expect(document.querySelector("#nexo-switch-pricing")).toBeInTheDocument();
    expect(document.querySelector("#nexo-switch-pricing")).toHaveClass("ksef-surface", "ksef-surface-featured");
  });
});
