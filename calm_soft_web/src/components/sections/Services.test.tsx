import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { services } from "@/content/services";
import { cases } from "@/content/cases";
import { demos } from "@/content/demos";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { Services } from "./Services";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

function renderServices() {
  return render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases} demos={demos}>
        <Services />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("Services section (HANDOFF §3 / §4, SPEC §6.4)", () => {
  it('clicking "Start with this service ›" does not open the modal and scrolls to contact', async () => {
    const { scrollToContact } = await import("@/lib/scroll");
    const user = userEvent.setup();
    renderServices();

    const startButtons = screen.getAllByRole("button", { name: "Start with this service ›" });
    expect(startButtons).toHaveLength(services.length);

    await user.click(startButtons[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(scrollToContact).toHaveBeenCalledTimes(1);
  });

  it("clicking a card's stretched \"Learn more ›\" opens the service modal for that card's service", async () => {
    const user = userEvent.setup();
    renderServices();

    const learnButtons = screen.getAllByRole("button", { name: "Learn more ›" });
    expect(learnButtons).toHaveLength(services.length);

    await user.click(learnButtons[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(services[0].headline)).toBeInTheDocument();
  });
});
