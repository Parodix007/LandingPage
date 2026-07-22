import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { services } from "@/content/services";
import { cases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider, useRegisterContactFocus } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { ServicesSlider } from "./ServicesSlider";

vi.mock("@/lib/scroll", () => ({ scrollToContact: vi.fn() }));

const LABELS = site.sections.services;

function getTrack(container: HTMLElement) {
  const track = container.querySelector('[data-testid="services-track"]') as HTMLElement | null;
  if (!track) throw new Error("services track not found");
  return track;
}

// Registers a focus-probe input via useRegisterContactFocus so the tile CTA's
// requestContactScroll/focusContactField hand-off (SPEC §6.2) is observable — mirrors
// providers.test.tsx's Harness pattern.
function FocusProbe() {
  const registerFocus = useRegisterContactFocus();
  useEffect(() => {
    registerFocus(() => document.getElementById("contact-focus-probe")?.focus());
    return () => registerFocus(null);
  }, [registerFocus]);
  return <input id="contact-focus-probe" aria-label="contact focus probe" />;
}

function renderSlider() {
  return render(
    <InquiryProvider>
      <ModalProvider cases={cases} demos={demos}>
        <FocusProbe />
        <ServicesSlider
          services={services}
          label={LABELS.sliderLabel}
          overviewLabel={LABELS.overviewLabel}
          fitLabel={LABELS.fitLabel}
          deliverLabel={LABELS.deliverLabel}
          approachLabel={LABELS.approachLabel}
          proofLabel={LABELS.proofLabel}
          readCaseLabel={LABELS.readCaseCta}
          ctaLabel={LABELS.cta}
          note={LABELS.note}
        />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("ServicesSlider (docs/superpowers/specs/2026-07-22-services-slider-design.md)", () => {
  it("renders all four service headlines as h3 headings", () => {
    renderSlider();
    for (const s of services) {
      expect(
        screen.getByRole("heading", { level: 3, name: s.headline, hidden: true }),
      ).toBeInTheDocument();
    }
  });

  it("renders the track at step 0 initially", () => {
    const { container } = renderSlider();
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("advances and retreats the track transform on next/prev", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();

    await user.click(screen.getByRole("button", { name: "Następna usługa" }));
    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");

    await user.click(screen.getByRole("button", { name: "Poprzednia usługa" }));
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("marks arrows aria-disabled at bounds and a bound click is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const prevButton = screen.getByRole("button", { name: "Poprzednia usługa" });
    const nextButton = screen.getByRole("button", { name: "Następna usługa" });

    expect(prevButton).toHaveAttribute("aria-disabled", "true");
    expect(nextButton).not.toHaveAttribute("aria-disabled", "true");

    await user.click(prevButton);
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");

    for (let i = 0; i < services.length - 1; i += 1) {
      await user.click(nextButton);
    }
    const lastTransform = `translateX(calc(${services.length - 1} * (-100% - 18px)))`;
    expect(nextButton).toHaveAttribute("aria-disabled", "true");
    expect(getTrack(container).style.transform).toBe(lastTransform);

    await user.click(nextButton);
    expect(getTrack(container).style.transform).toBe(lastTransform);
  });

  it("dots show the service tag and jump to that slide when clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const target = services[2];
    const dot = screen.getByRole("button", { name: `Przejdź do: ${target.tag}` });
    expect(dot).toHaveTextContent(target.tag);

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(2 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("renders the full former-modal content for the active tile", () => {
    renderSlider();
    const s = services[0];

    expect(screen.getByText(s.intro)).toBeInTheDocument();
    for (const item of s.fit) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const d of s.deliver) {
      expect(screen.getByText(d.n)).toBeInTheDocument();
    }
    expect(screen.getByText(s.approach)).toBeInTheDocument();

    // Section labels + the note are static copy repeated on every tile (all 4 render, only the
    // active one is visible/not aria-hidden) — assert one instance per service.
    for (const label of [
      LABELS.overviewLabel,
      LABELS.fitLabel,
      LABELS.deliverLabel,
      LABELS.approachLabel,
      LABELS.proofLabel,
    ]) {
      expect(screen.getAllByText(label, { exact: true })).toHaveLength(services.length);
    }
    expect(screen.getAllByText(LABELS.note, { exact: true })).toHaveLength(services.length);
  });

  it("shows a related-case mini-card with m1v + headline per resolved relatedSlug", () => {
    renderSlider();
    const s = services[0];
    const relatedCases = s.relatedSlugs
      .map((slug) => getCaseBySlug(slug))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    expect(relatedCases.length).toBeGreaterThan(0);

    for (const c of relatedCases) {
      const button = screen.getByRole("button", { name: `Przeczytaj historię: ${c.client}` });
      const miniCard = button.closest(".card-host");
      expect(miniCard).not.toBeNull();
      expect(within(miniCard as HTMLElement).getByText(c.m1v)).toBeInTheDocument();
      expect(within(miniCard as HTMLElement).getByText(c.headline)).toBeInTheDocument();
    }
  });

  it("clicking the first mini-card's Read the story button opens the case modal", async () => {
    const user = userEvent.setup();
    renderSlider();
    const s = services[0];
    const firstCase = getCaseBySlug(s.relatedSlugs[0])!;

    await user.click(screen.getByRole("button", { name: `Przeczytaj historię: ${firstCase.client}` }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: firstCase.headline })).toBeInTheDocument();
  });

  it("clicking the active tile's CTA scrolls to contact and focuses the registered field, without opening a dialog", async () => {
    const { scrollToContact } = await import("@/lib/scroll");
    const user = userEvent.setup();
    renderSlider();

    const ctaButtons = screen.getAllByRole("button", { name: LABELS.cta, hidden: true });
    await user.click(ctaButtons[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(scrollToContact).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(screen.getByLabelText("contact focus probe")).toHaveFocus();
  });

  it("keeps roving tabIndex on tile CTAs (active has none, others -1) and shifts on next", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();

    const ctaButtons = screen.getAllByRole("button", { name: LABELS.cta, hidden: true });
    expect(ctaButtons).toHaveLength(services.length);
    expect(ctaButtons[0]).not.toHaveAttribute("tabIndex");
    for (const btn of ctaButtons.slice(1)) {
      expect(btn).toHaveAttribute("tabIndex", "-1");
    }

    // Mini-card spot check: the first mini-card button on the (inactive) second slide also
    // carries tabIndex=-1. Scoped to that slide specifically — related-case slugs can repeat
    // across services (e.g. "public-sector-poland" is related to both core and web), so an
    // unscoped lookup by aria-label could match more than one button.
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]');
    const secondSlideButtons = within(slides[1] as HTMLElement).getAllByRole("button", {
      hidden: true,
    });
    const inactiveMiniCardButton = secondSlideButtons.find((b) =>
      b.getAttribute("aria-label")?.startsWith("Przeczytaj historię:"),
    );
    expect(inactiveMiniCardButton).toBeDefined();
    expect(inactiveMiniCardButton).toHaveAttribute("tabIndex", "-1");

    await user.click(screen.getByRole("button", { name: "Następna usługa" }));

    const ctaButtonsAfter = screen.getAllByRole("button", { name: LABELS.cta, hidden: true });
    expect(ctaButtonsAfter[0]).toHaveAttribute("tabIndex", "-1");
    expect(ctaButtonsAfter[1]).not.toHaveAttribute("tabIndex");
  });

  it("marks inactive slides aria-hidden and the active slide not hidden", () => {
    const { container } = renderSlider();
    const slides = Array.from(
      container.querySelectorAll('[role="group"][aria-roledescription="slide"]'),
    );
    expect(slides).toHaveLength(services.length);
    expect(slides[0]).not.toHaveAttribute("aria-hidden");
    for (const slide of slides.slice(1)) {
      expect(slide).toHaveAttribute("aria-hidden", "true");
    }
  });
});
