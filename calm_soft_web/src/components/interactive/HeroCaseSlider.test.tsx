import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cases as allCases, getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { site } from "@/content/site";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import type { CaseStudy } from "@/content/types";
import { HeroCaseSlider } from "./HeroCaseSlider";

const LABEL = "Featured work";
const READ_CASE_LABEL = site.sections.services.readCaseCta;

// Mirrors Hero.tsx's own resolution of site.featuredCaseSlugs (never by index) — this is
// exactly the 3-case set the component actually receives in production, and content.test.ts
// already guards that featuredCaseSlugs has exactly 3 valid, unique slugs.
const cases: CaseStudy[] = site.featuredCaseSlugs
  .map((slug) => getCaseBySlug(slug))
  .filter((c): c is CaseStudy => c !== undefined);

function getTrack(container: HTMLElement) {
  const track = container.querySelector('[data-testid="hero-case-track"]') as HTMLElement | null;
  if (!track) throw new Error("hero case track not found");
  return track;
}

// HeroCaseSlider's CTA calls useModal()'s openCaseModal, so it must render inside ModalProvider
// (which itself needs InquiryProvider — see ModalProvider's ctaClose path) — mirrors
// ServicesSlider.test.tsx's renderSlider wrapper.
function renderSlider() {
  return render(
    <InquiryProvider>
      <ModalProvider cases={allCases} demos={demos}>
        <HeroCaseSlider cases={cases} label={LABEL} readCaseLabel={READ_CASE_LABEL} />
      </ModalProvider>
    </InquiryProvider>,
  );
}

describe("HeroCaseSlider", () => {
  it("renders exactly three slides", () => {
    const { container } = renderSlider();
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]');
    expect(cases).toHaveLength(3);
    expect(slides).toHaveLength(3);
  });

  it("renders the track at step 0 initially", () => {
    const { container } = renderSlider();
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("advances the track transform when Next is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();

    await user.click(screen.getByRole("button", { name: "Następna realizacja" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("retreats the track transform when Previous is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Następna realizacja" });

    await user.click(nextButton);
    await user.click(screen.getByRole("button", { name: "Poprzednia realizacja" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("marks Previous aria-disabled at step 0, and Next is not disabled initially", () => {
    renderSlider();
    expect(screen.getByRole("button", { name: "Poprzednia realizacja" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Następna realizacja" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("marks Next aria-disabled at the last slide and clicking it again is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Następna realizacja" });

    for (let i = 0; i < cases.length - 1; i += 1) {
      await user.click(nextButton);
    }

    expect(nextButton).toHaveAttribute("aria-disabled", "true");
    const lastTransform = `translateX(calc(${cases.length - 1} * (-100% - 18px)))`;
    expect(getTrack(container).style.transform).toBe(lastTransform);

    await user.click(nextButton);
    expect(getTrack(container).style.transform).toBe(lastTransform);
  });

  it("jumps to a case when its dot is clicked and marks that dot aria-current", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const target = cases[2];
    const dot = screen.getByRole("button", { name: `Przejdź do: ${target.tag}` });

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(2 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("renders every case's dot with its tag as the visible label", () => {
    renderSlider();
    for (const c of cases) {
      const dot = screen.getByRole("button", { name: `Przejdź do: ${c.tag}` });
      expect(dot).toHaveTextContent(c.tag);
    }
  });

  it("renders the headline as plain (non-heading) text for every case — heading-order fix", () => {
    renderSlider();
    for (const c of cases) {
      expect(screen.getByText(c.headline, { exact: true })).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: c.headline, hidden: true }),
      ).not.toBeInTheDocument();
    }
  });

  it("renders the tag chip, client and teaser for every case", () => {
    renderSlider();
    for (const c of cases) {
      expect(screen.getAllByText(c.tag, { exact: true }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(c.client, { exact: true }).length).toBeGreaterThan(0);
      expect(screen.getByText(c.teaser)).toBeInTheDocument();
    }
  });

  it("renders m1v/m1l for every case, and m2v/m2l only when both are present", () => {
    renderSlider();
    for (const c of cases) {
      expect(screen.getByText(c.m1v, { exact: true })).toBeInTheDocument();
      expect(screen.getByText(c.m1l)).toBeInTheDocument();
      if (c.m2v && c.m2l) {
        expect(screen.getByText(c.m2v, { exact: true })).toBeInTheDocument();
        expect(screen.getByText(c.m2l)).toBeInTheDocument();
      }
    }
  });

  it("keeps only the active slide's CTA focusable (no tabIndex vs tabIndex=-1), shifting after next", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]');

    const cta0 = within(slides[0] as HTMLElement).getByRole("button", { name: READ_CASE_LABEL });
    const cta1 = within(slides[1] as HTMLElement).getByRole("button", {
      name: READ_CASE_LABEL,
      hidden: true,
    });

    expect(cta0).not.toHaveAttribute("tabIndex");
    expect(cta1).toHaveAttribute("tabIndex", "-1");

    await user.click(screen.getByRole("button", { name: "Następna realizacja" }));

    expect(cta0).toHaveAttribute("tabIndex", "-1");
    expect(cta1).not.toHaveAttribute("tabIndex");
  });

  it("marks inactive slides aria-hidden and the active slide not hidden", () => {
    const { container } = renderSlider();
    const slides = Array.from(
      container.querySelectorAll('[role="group"][aria-roledescription="slide"]'),
    );
    expect(slides[0]).not.toHaveAttribute("aria-hidden");
    for (const slide of slides.slice(1)) {
      expect(slide).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("clicking a case's CTA opens the case modal with that case's headline", async () => {
    const user = userEvent.setup();
    renderSlider();
    const first = cases[0];

    await user.click(screen.getByRole("button", { name: READ_CASE_LABEL }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: first.headline })).toBeInTheDocument();
  });

  it("opens the correct case's modal after navigating to a later slide", async () => {
    const user = userEvent.setup();
    renderSlider();
    const target = cases[1];

    await user.click(screen.getByRole("button", { name: "Następna realizacja" }));
    await user.click(screen.getByRole("button", { name: READ_CASE_LABEL }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: target.headline })).toBeInTheDocument();
  });
});
