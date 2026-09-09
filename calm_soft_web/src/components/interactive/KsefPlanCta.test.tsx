import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KsefPlanCta } from "./KsefPlanCta";

const mockPrefillContactMessage = vi.fn();
const mockRequestContactScroll = vi.fn();
const mockFocusContactField = vi.fn();

vi.mock("@/components/providers/InquiryProvider", () => ({
  useInquiry: () => ({
    prefillContactMessage: mockPrefillContactMessage,
    requestContactScroll: mockRequestContactScroll,
    focusContactField: mockFocusContactField,
  }),
}));

describe("KsefPlanCta", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a button (not a link) with the label as its accessible name", () => {
    render(<KsefPlanCta label="Wybieram pakiet Firma" prefill="Interesuje mnie pakiet Firma." />);
    const button = screen.getByRole("button", { name: "Wybieram pakiet Firma" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls prefillContactMessage, requestContactScroll, then focusContactField in order on click", async () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const calls: string[] = [];
    mockPrefillContactMessage.mockImplementation(() => calls.push("prefill"));
    mockRequestContactScroll.mockImplementation(() => calls.push("scroll"));
    mockFocusContactField.mockImplementation(() => calls.push("focus"));

    const user = userEvent.setup();
    render(<KsefPlanCta label="Wybieram pakiet Firma" prefill="Interesuje mnie pakiet Firma." />);
    await user.click(screen.getByRole("button", { name: "Wybieram pakiet Firma" }));

    expect(mockPrefillContactMessage).toHaveBeenCalledWith("Interesuje mnie pakiet Firma.");
    expect(calls).toEqual(["prefill", "scroll", "focus"]);
  });

  it("renders GhostPill markup when variant='ghost'", () => {
    render(<KsefPlanCta label="Porozmawiaj o pakiecie PRO" prefill="x" variant="ghost" />);
    const button = screen.getByRole("button", { name: "Porozmawiaj o pakiecie PRO" });
    expect(button).not.toHaveClass("bg-accent");
  });

  it("renders FilledPill markup by default", () => {
    render(<KsefPlanCta label="Wybieram pakiet Firma" prefill="x" />);
    const button = screen.getByRole("button", { name: "Wybieram pakiet Firma" });
    expect(button).toHaveClass("bg-accent");
  });
});
