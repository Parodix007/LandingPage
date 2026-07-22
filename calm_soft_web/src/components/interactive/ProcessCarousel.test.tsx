import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { steps } from "@/content/steps";
import { ProcessCarousel } from "./ProcessCarousel";

function getTrack(container: HTMLElement) {
  const track = container.querySelector('[data-testid="process-track"]') as HTMLElement | null;
  if (!track) throw new Error("process track not found");
  return track;
}

describe("ProcessCarousel (2026-07-22 pl-copy handoff — 5 steps 00-04, PL arias)", () => {
  it("is data-driven over the 5 steps 00-04", () => {
    expect(steps).toHaveLength(5);
    expect(steps.map((s) => s.number)).toEqual(["00", "01", "02", "03", "04"]);
  });

  it('renders the track at step 0 ("00 Rozmowa", the free intro call) initially', () => {
    const { container } = render(<ProcessCarousel steps={steps} />);
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("advances the track transform when Next step is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);

    await user.click(screen.getByRole("button", { name: "Następny krok" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("Previous step is aria-disabled at step 0, the new default (lower bound)", () => {
    render(<ProcessCarousel steps={steps} />);
    const prevButton = screen.getByRole("button", { name: "Poprzedni krok" });
    expect(prevButton).toHaveAttribute("aria-disabled", "true");
  });

  it("clicking Previous step at the lower bound (step 0) is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);
    const prevButton = screen.getByRole("button", { name: "Poprzedni krok" });

    await user.click(prevButton);

    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("marks Next step aria-disabled at the upper bound and clicking it again is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);
    const nextButton = screen.getByRole("button", { name: "Następny krok" });

    for (let i = 0; i < steps.length - 1; i += 1) {
      await user.click(nextButton);
    }

    expect(nextButton).toHaveAttribute("aria-disabled", "true");
    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${steps.length - 1} * (-100% - 18px)))`,
    );

    await user.click(nextButton);

    expect(getTrack(container).style.transform).toBe(
      `translateX(calc(${steps.length - 1} * (-100% - 18px)))`,
    );
  });

  it("jumps to a step when its dot is clicked and marks that dot aria-current", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);
    const dot = screen.getByRole("button", { name: "Przejdź do kroku 03" });

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(3 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });

  it("renders every step's title from content (no hardcoded English titles)", () => {
    render(<ProcessCarousel steps={steps} />);
    for (const s of steps) {
      expect(screen.getByRole("heading", { name: s.title, hidden: true })).toBeInTheDocument();
    }
  });
});
