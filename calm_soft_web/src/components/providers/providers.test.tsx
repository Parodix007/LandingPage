import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { InquiryProvider, useRegisterContactFocus } from "./InquiryProvider";
import { ModalProvider, useModal, useModalCtaClose } from "./ModalProvider";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

const CASE_SLUG = cases[0].slug;
const DEMO_SLUG = demos[0].slug;

// Small test harness exercising the contracts real consumers (CardActions, ModalCta,
// ContactForm, ServicesSlider) will use — see SPEC §6.2/§6.3/§6.5, as amended by
// docs/superpowers/specs/2026-07-22-services-slider-design.md (the service modal and
// openServiceModal are gone; only case/demo modal kinds remain).
function Harness() {
  const { openCaseModal, openDemoModal } = useModal();
  const ctaClose = useModalCtaClose();
  const registerFocus = useRegisterContactFocus();

  return (
    <div>
      <button onClick={() => openCaseModal(CASE_SLUG)}>Open case</button>
      <button onClick={() => openDemoModal(DEMO_SLUG)}>Open demo</button>
      <button onClick={() => ctaClose()}>CTA close</button>
      <button
        onClick={() =>
          registerFocus(() => document.getElementById("contact-focus-target")?.focus())
        }
      >
        Register focus handler
      </button>
      <input id="contact-focus-target" aria-label="contact focus target" />
    </div>
  );
}

function renderHarness() {
  render(
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <Harness />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("ModalProvider / InquiryProvider integration (SPEC §14.2, as amended by 2026-07-22 services-slider design)", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  it("openCaseModal shows the dialog, locks scroll, and focuses the close button", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open case" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Zamknij" })).toHaveFocus();
  });

  it("keeps the scroll lock when switching from a case modal to a demo modal", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open case" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Open demo" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Esc after a case→demo switch closes the dialog, unlocks scroll, and returns focus to the original opener", async () => {
    const user = userEvent.setup();
    renderHarness();

    const opener = screen.getByRole("button", { name: "Open case" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Open demo" }));

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(opener).toHaveFocus();
  });

  it("refocuses the close button when the modal's content is replaced in place (contentKey regression coverage only — the in-content-switch trigger retired with the service modal)", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open case" }));
    expect(screen.getByText(getCaseBySlug(CASE_SLUG)!.headline)).toBeInTheDocument();

    // These harness buttons are both external triggers (unlike the retired service modal's
    // in-content related-case mini-card, which unmounted itself mid-switch) — they only stand
    // in for Modal's contentKey mechanism itself, which still needs to keep focus inside the
    // dialog whenever content is swapped in place while `open` stays true.
    await user.click(screen.getByRole("button", { name: "Open demo" }));

    expect(screen.getByText(demos[0].tagline)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zamknij" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("the CTA-close path on a case modal closes it, scrolls, focuses the registered handler, and does NOT return focus to the opener", async () => {
    const { scrollToContact } = await import("@/lib/scroll");
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Register focus handler" }));

    const opener = screen.getByRole("button", { name: "Open case" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "CTA close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // requestContactScroll()/focusContactField() run inside a rAF callback.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(scrollToContact).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("contact focus target")).toHaveFocus();
    expect(opener).not.toHaveFocus();
  });

  it("openDemoModal shows the dialog with the demo's tagline as its accessible name, and Esc returns focus to the opener", async () => {
    const user = userEvent.setup();
    renderHarness();

    const opener = screen.getByRole("button", { name: "Open demo" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName(demos[0].tagline);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(opener).toHaveFocus();
  });
});
