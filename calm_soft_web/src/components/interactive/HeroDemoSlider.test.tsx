import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { demos } from "@/content/demos";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { services } from "@/content/services";
import { cases } from "@/content/cases";
import { HeroDemoSlider } from "./HeroDemoSlider";

const LABEL = "Live demos";
const OPEN_LABEL = "Open the demo ›";
const LANG_CHIP = "Demo in Polish";
const DETAIL_LABEL = "View details ›";

function getTrack(container: HTMLElement) {
  const track = container.querySelector('[data-testid="hero-demo-track"]') as HTMLElement | null;
  if (!track) throw new Error("hero demo track not found");
  return track;
}

function renderSlider() {
  return render(
    <InquiryProvider>
      <ModalProvider services={services} cases={cases} demos={demos}>
        <HeroDemoSlider
          demos={demos}
          label={LABEL}
          openLabel={OPEN_LABEL}
          langChip={LANG_CHIP}
          detailLabel={DETAIL_LABEL}
        />
      </ModalProvider>
    </InquiryProvider>,
  );
}

// Links inside inactive slides sit under aria-hidden="true" — *ByRole excludes them from the
// accessibility tree by default, so every lookup here that may target an inactive slide's link
// passes `{ hidden: true }` to see the full DOM regardless of step.
function getOpenLink(name: string) {
  return screen.getByRole("link", { name: `Open the demo: ${name}`, hidden: true });
}

describe("HeroDemoSlider", () => {
  it("renders all three demo names", () => {
    renderSlider();
    for (const d of demos) {
      // Dot buttons also render the demo name as their own text (see DOT_BASE comment in
      // HeroDemoSlider.tsx), so scope to the slide heading specifically. Two of the three
      // headings sit in aria-hidden inactive slides at step 0, hence `hidden: true`.
      expect(screen.getByRole("heading", { name: d.name, hidden: true })).toBeInTheDocument();
    }
  });

  it("renders the track at step 0 initially", () => {
    const { container } = renderSlider();
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("advances the track transform when Next demo is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();

    await user.click(screen.getByRole("button", { name: "Next demo" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("retreats the track transform when Previous demo is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Next demo" });

    await user.click(nextButton);
    await user.click(nextButton);
    await user.click(screen.getByRole("button", { name: "Previous demo" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("marks Previous demo aria-disabled at step 0, and Next demo is not disabled initially", () => {
    renderSlider();
    expect(screen.getByRole("button", { name: "Previous demo" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Next demo" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("marks Next demo aria-disabled at the last slide and clicking it again is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const nextButton = screen.getByRole("button", { name: "Next demo" });

    for (let i = 0; i < demos.length - 1; i += 1) {
      await user.click(nextButton);
    }

    expect(nextButton).toHaveAttribute("aria-disabled", "true");
    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${demos.length - 1} * (-100% - 18px)))`,
    );

    await user.click(nextButton);

    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${demos.length - 1} * (-100% - 18px)))`,
    );
  });

  it("jumps to a demo when its dot is clicked and marks that dot aria-current", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider();
    const target = demos[2];
    const dot = screen.getByRole("button", { name: `Go to ${target.name}` });

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(2 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("keeps only the active slide's open link focusable (no tabIndex vs tabIndex=-1)", async () => {
    const user = userEvent.setup();
    renderSlider();

    const link0 = getOpenLink(demos[0].name);
    const link1 = getOpenLink(demos[1].name);
    const link2 = getOpenLink(demos[2].name);

    expect(link0).not.toHaveAttribute("tabIndex");
    expect(link1).toHaveAttribute("tabIndex", "-1");
    expect(link2).toHaveAttribute("tabIndex", "-1");

    await user.click(screen.getByRole("button", { name: "Next demo" }));

    expect(link0).toHaveAttribute("tabIndex", "-1");
    expect(link1).not.toHaveAttribute("tabIndex");
    expect(link2).toHaveAttribute("tabIndex", "-1");
  });

  it("every open link points at /demo/<slug>/index.html and opens in a new tab", () => {
    renderSlider();
    for (const d of demos) {
      const link = getOpenLink(d.name);
      expect(link).toHaveAttribute("href", `/demo/${d.slug}/index.html`);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("opens the demo detail modal when the active slide's View details trigger is clicked", async () => {
    const user = userEvent.setup();
    renderSlider();

    await user.click(screen.getByRole("button", { name: `View ${demos[0].name} details` }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleName(demos[0].tagline);
  });

  it("keeps only the active slide's details trigger focusable (no tabIndex vs tabIndex=-1)", () => {
    renderSlider();

    const trigger0 = screen.getByRole("button", { name: `View ${demos[0].name} details` });
    const trigger1 = screen.getByRole("button", {
      name: `View ${demos[1].name} details`,
      hidden: true,
    });
    const trigger2 = screen.getByRole("button", {
      name: `View ${demos[2].name} details`,
      hidden: true,
    });

    expect(trigger0).not.toHaveAttribute("tabIndex");
    expect(trigger1).toHaveAttribute("tabIndex", "-1");
    expect(trigger2).toHaveAttribute("tabIndex", "-1");
  });
});
