import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Service } from "@/content/types";
import { services } from "@/content/services";
import { cases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import {
  InquiryProvider,
  useInquiry,
  useRegisterServiceRadioFocus,
} from "./InquiryProvider";
import { ModalProvider, useModal, useModalCtaClose } from "./ModalProvider";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

// Bridge the real openCaseModal into the mocked section without importing ModalProvider
// inside the mock factory (that would be a circular import: ModalProvider → the mocked
// ServiceModalContent → ModalProvider). Hoisted so the factory below may reference it.
const modalBridge = vi.hoisted(() => ({
  openCaseModal: undefined as ((slug: string) => void) | undefined,
}));

// Simulate the Task 5 service modal, whose related-case "Read the story ›" mini-card lives
// INSIDE the modal content. When it triggers the service→case switch it unmounts — the
// scenario the external-trigger tests below cannot reproduce (their triggers stay mounted).
vi.mock("@/components/sections/ServiceModalContent", () => ({
  ServiceModalContent: ({ service }: { service: Service }) => (
    <div id="modal-headline">
      {service.headline}
      <button onClick={() => modalBridge.openCaseModal?.(service.relatedSlugs[0])}>
        In-modal switch to related case
      </button>
    </div>
  ),
}));

const SERVICE_ID = services[0].id;
const CASE_SLUG = services[0].relatedSlugs[0];
const DEMO_SLUG = demos[0].slug;

// Small test harness exercising the contracts real consumers (CardActions, ModalCta,
// ContactForm) will use during the fan-out — see SPEC §6.2/§6.3/§6.5.
function Harness() {
  const { openServiceModal, openCaseModal, openDemoModal } = useModal();
  const ctaClose = useModalCtaClose();
  const { selectedService } = useInquiry();
  const registerFocus = useRegisterServiceRadioFocus();

  // Expose the real openCaseModal to the mocked in-content trigger (see modalBridge above).
  // In an effect, not the render body (react-hooks/immutability); runs before any click.
  useEffect(() => {
    modalBridge.openCaseModal = openCaseModal;
  }, [openCaseModal]);

  return (
    <div>
      <button onClick={() => openServiceModal(SERVICE_ID)}>Open service</button>
      <button onClick={() => openCaseModal(CASE_SLUG)}>Open case</button>
      <button onClick={() => openDemoModal(DEMO_SLUG)}>Open demo</button>
      <button onClick={() => ctaClose(SERVICE_ID)}>CTA close</button>
      <button onClick={() => registerFocus(() => document.getElementById("radio-focus-target")?.focus())}>
        Register focus handler
      </button>
      <input id="radio-focus-target" aria-label="radio focus target" />
      <div data-testid="selected-service">{selectedService ?? "none"}</div>
    </div>
  );
}

function renderHarness() {
  render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases} demos={demos}>
        <Harness />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("ModalProvider / InquiryProvider integration (SPEC §14.2)", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  it("openServiceModal shows the dialog, locks scroll, and focuses the close button", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open service" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("keeps the scroll lock when switching from a service modal to a case modal", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open service" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Open case" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Esc after a service→case switch closes the dialog, unlocks scroll, and returns focus to the original opener", async () => {
    const user = userEvent.setup();
    renderHarness();

    const opener = screen.getByRole("button", { name: "Open service" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Open case" }));

    // Escape is dispatched on the dialog itself (matching Modal.test.tsx) — in the real app
    // the element that switches service→case (e.g. a related-case mini-card) lives INSIDE
    // the open modal, so the keydown naturally bubbles to Modal's backdrop handler from
    // there; the harness's external trigger buttons are a stand-in for that click only.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(opener).toHaveFocus();
  });

  it("refocuses the close button on an in-content service→case switch, keeping Esc working (FIX 1)", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Open service" }));

    // The switch is triggered from a control INSIDE the modal content subtree; it unmounts on
    // the swap. Without Modal's contentKey-driven refocus, focus would fall to <body> and the
    // overlay's onKeyDown handler (an ancestor) would stop receiving Esc/Tab. jsdom focus
    // semantics are indicative here — this path is re-confirmed in a real browser at Task 9.
    await user.click(screen.getByRole("button", { name: "In-modal switch to related case" }));

    // (a) case content is shown
    const expectedCase = getCaseBySlug(services[0].relatedSlugs[0]);
    expect(screen.getByText(expectedCase!.headline)).toBeInTheDocument();
    // (b) focus is back inside the dialog (on the close button)
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    // (c) Esc still closes the modal afterwards
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("the CTA-close path closes the modal, selects the service, scrolls, focuses the registered handler, and does NOT return focus to the opener", async () => {
    const { scrollToContact } = await import("@/lib/scroll");
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Register focus handler" }));

    const opener = screen.getByRole("button", { name: "Open service" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "CTA close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("selected-service")).toHaveTextContent(SERVICE_ID);

    // requestContactScroll()/focusSelectedServiceRadio() run inside a rAF callback.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(scrollToContact).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("radio focus target")).toHaveFocus();
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
