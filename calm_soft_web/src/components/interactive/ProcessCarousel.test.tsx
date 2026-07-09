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

describe("ProcessCarousel", () => {
  it('renders the track at step 1 ("01 Design") initially', () => {
    const { container } = render(<ProcessCarousel steps={steps} />);
    expect(getTrack(container).style.transform).toBe("translateX(calc(1 * (-100% - 18px)))");
  });

  it("advances the track transform when Next step is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);

    await user.click(screen.getByRole("button", { name: "Next step" }));

    expect(getTrack(container).style.transform).toBe("translateX(calc(2 * (-100% - 18px)))");
  });

  it("Previous step is not disabled initially (default step is 1, not the lower bound)", () => {
    render(<ProcessCarousel steps={steps} />);
    const prevButton = screen.getByRole("button", { name: "Previous step" });
    expect(prevButton).not.toHaveAttribute("aria-disabled", "true");
  });

  it("marks Previous step aria-disabled at the lower bound and clicking it again is a no-op", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);
    const prevButton = screen.getByRole("button", { name: "Previous step" });

    // Default step is 1; one click reaches the lower bound (step 0, "00 Discover").
    await user.click(prevButton);
    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
    expect(prevButton).toHaveAttribute("aria-disabled", "true");

    await user.click(prevButton);

    expect(getTrack(container).style.transform).toBe("translateX(calc(0 * (-100% - 18px)))");
  });

  it("jumps to a step when its dot is clicked and marks that dot aria-current", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProcessCarousel steps={steps} />);
    const dot = screen.getByRole("button", { name: "Go to step 03" });

    await user.click(dot);

    expect(getTrack(container).style.transform).toBe("translateX(calc(3 * (-100% - 18px)))");
    expect(dot).toHaveAttribute("aria-current", "true");
  });
});
